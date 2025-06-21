import { Parser } from "node-sql-parser";
import initSqlJs, { Database } from "sql.js";
import sqliteUrl from "./assets/sql-wasm.wasm?url";
import databaseInfo from "./assets/databaseInfo.sqlite?raw";
import { getQueryInstructions, getResponseAgentInstructions, getResponseInstructions } from "./instructions";
import { Chat, GoogleGenAI } from "@google/genai";
class DBState {
  static initialized = false;
  static instance: Database | null = null;
}

class AgentState {
  static agent: GoogleGenAI | null = null;
  static queryInstance: Chat | null = null;
  static conversationInstance: Chat | null = null;
}

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: () => sqliteUrl,
  });

  DBState.instance = new SQL.Database();

  const response = DBState.instance.exec(databaseInfo);
  console.log("Database initialized with response:", response);
  DBState.initialized = true;
}

if (!DBState.initialized) {
  initDatabase();
}

export async function isValidApiKey(apiKey: string): Promise<void | string> {
  try {
    if (!apiKey || apiKey.length == 0) {
      return "API key is required";
    }
    const agent = new GoogleGenAI({ apiKey });
    const response = await agent.models.countTokens({
      model: "gemini-2.0-flash",
      contents: "Hello",
    });
    console.log(`Count token response: `, response);
    console.log("API Key is valid");
    return;
  } catch (error) {
    return "Invalid API key";
  }
}

async function generateQueries(apiKey: string, prompt: string): Promise<string[]> {
  try {
    if (!AgentState.agent) {
      AgentState.agent = new GoogleGenAI({ apiKey });
    }
    if (!AgentState.queryInstance) {
      AgentState.queryInstance = AgentState.agent.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: getQueryInstructions(),
          thinkingConfig: {
            thinkingBudget: 2048,
          },
        },
      });
    }
    const queryInstance = AgentState.queryInstance;
    const response = await queryInstance.sendMessage({ message: prompt });
    const text = response.text;
    if (text) {
      const startingIndex = text.indexOf("[");
      const endingIndex = text.lastIndexOf("]");
      if (startingIndex === -1 || endingIndex === -1 || startingIndex >= endingIndex) {
        throw new Error(`failed to generate sql query: could not find valid JSON array in response: ${text}`);
      }
      const jsonArray = text.substring(startingIndex, endingIndex + 1);
      if (jsonArray.length === 0) {
        throw new Error(`failed to generate sql query: empty JSON array in response: ${text}`);
      }
      const parsedQueries = JSON.parse(jsonArray);
      if (!Array.isArray(parsedQueries)) {
        throw new Error(`failed to generate sql query: response is not a valid JSON array: ${text}`);
      }
      if (parsedQueries.length === 0) {
        throw new Error(`failed to generate sql query: no queries generated in response: ${text}`);
      }
      return parsedQueries.map((query: string) => {
        if (query.endsWith(";")) {
          return query.trim();
        }
        return `${query.trim()};`;
      });
    }
    throw new Error(`failed to generate sql query: could not parse response: ${text}`);
  } catch (err) {
    throw new Error(`failed to generate sql query: ${(err as Error).message}`);
  }
}

export async function getQueries(apiKey: string, prompt: string): Promise<string[]> {
  const acceptedQueries: string[] = [];
  let generatedQueries: string[] = [];
  let failedQueries: string[] = [];
  let attempts = 0;
  do {
    failedQueries = [];
    if (generatedQueries.length == 0) {
      generatedQueries = await generateQueries(apiKey, prompt);
    }
    for (const query of generatedQueries) {
      const valid = validateQuery(query);
      if (valid) {
        acceptedQueries.push(query);
        console.log(`Accepted query: ${query}`);
      } else {
        failedQueries.push(query);
      }
    }
    if (failedQueries.length > 0) {
      // generatedQueries = await fixQueries(apiKey, prompt, failedQueries);
    }
    attempts++;
  } while (failedQueries.length != 0 && attempts < 3);
  return acceptedQueries;
}

export async function getResponse(
  apiKey: string,
  prompt: string,
  queryResponses: { success: Record<string, Record<string, any>[]>; fail: string[] }
): Promise<string> {
  try {
    if (!AgentState.agent) {
      AgentState.agent = new GoogleGenAI({ apiKey });
    }
    if (!AgentState.conversationInstance) {
      AgentState.conversationInstance = AgentState.agent.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: getResponseAgentInstructions(),
          thinkingConfig: {
            thinkingBudget: 1024,
          },
        },
      });
    }
    const conversationInstance = AgentState.conversationInstance;
    const conversationMessage = `user: ${prompt}\n ${getResponseInstructions(queryResponses)}`;
    console.log(`Conversation message: ${conversationMessage}`);
    const response = await conversationInstance.sendMessage({
      message: conversationMessage,
    });
    if (response.text) {
      return response.text;
    }

    throw new Error("failed to generate response: could not parse response");
  } catch (err) {
    return `failed to generate response: ${(err as Error).message}`;
  }
}

function validateQuery(query: string) {
  try {
    const parser = new Parser();
    parser.astify(query);
    return true;
  } catch (error) {
    console.log("Error parsing query:", error);
    return false;
  }
}

function formatQueryResponse(response: initSqlJs.QueryExecResult[]) {
  const rows: Record<string, any>[] = [];
  if (response.length != 1) {
    throw new Error("Expected query response to be an array with one entry.");
  }
  const columns = response[0].columns;
  for (const row of response[0].values) {
    const convertedRow: Record<string, any> = {};
    row.forEach((value, index) => {
      convertedRow[columns[index]] = value;
    });
    rows.push(convertedRow);
  }
  return rows;
}

export async function runQueries(queries: string[]): Promise<{ success: Record<string, Record<string, any>[]>; fail: string[] }> {
  const success: Record<string, Record<string, any>[]> = {};
  const fail: string[] = [];
  const response = { success, fail };
  for (const query of queries) {
    try {
      // run the query with sqlite
      const result = DBState.instance!.exec(query);
      const formattedResponse = formatQueryResponse(result);
      response.success[query] = formattedResponse;
      console.log(`${query}\n Returned: ${JSON.stringify(formattedResponse, null, 2)}`);
    } catch (err) {
      if ((err as Error).message.includes("to be an array with one entry.")) {
        response.success[query] = [{ message: "now rows returned" }];
      } else {
        console.log(`Error running query: ${query}`);
        response.fail.push(query);
      }
    }
  }
  return response;
}
