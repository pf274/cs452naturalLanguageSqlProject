import { Parser } from "node-sql-parser";
import OpenAI from "openai";
import initSqlJs, { Database } from "sql.js";
import sqliteUrl from "./assets/sql-wasm.wasm?url";
import databaseInfo from "./assets/databaseInfo.sqlite?raw";
import { ChatMessage } from "./ChatMessage";
import { getFixQueryInstructions, getQueryInstructions, getResponseInstructions } from "./instructions";
class DBState {
  static initialized = false;
  static instance: Database | null = null;
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
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    await openai.models.list();
    console.log("API Key is valid");
    return;
  } catch (error) {
    if (((error as any).code = "invalid_api_key")) {
      return "Invalid API key";
    } else {
      return (error as any).error;
    }
  }
}

async function generateQueries(apiKey: string, prompt: string, history: ChatMessage[]): Promise<string[]> {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const historyMessages = history
      .map((chatMessage) => ({
        role: chatMessage.isUser ? "user" : "assistant",
        content: chatMessage.isUser
          ? chatMessage.message
          : chatMessage.queries.length > 0
          ? chatMessage.queries.join(" ")
          : `Another ai agent responded (NOT YOU): ${chatMessage.message}`,
      }))
      .slice(-3) as any;
    const instructions = getQueryInstructions();
    console.log(instructions);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: instructions,
        },
        ...historyMessages,
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    if (response?.choices && response.choices.length > 0 && response.choices[0].message?.content) {
      const generatedQueries = response.choices[0].message.content;
      return generatedQueries
        .split(";")
        .map((entry) => entry.replace(/\n/g, " ").trim())
        .filter((entry) => entry.length > 0)
        .map((entry) => `${entry};`);
    }
    throw new Error("failed to generate sql query: could not parse responses");
  } catch (err) {
    throw new Error(`failed to generate sql query: ${(err as Error).message}`);
  }
}

async function fixQueries(apiKey: string, prompt: string, failedQueries: string[]) {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const instructions = getFixQueryInstructions(failedQueries);
    console.log(instructions);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: instructions,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    if (response?.choices && response.choices.length > 0 && response.choices[0].message?.content) {
      const generatedQueries = response.choices[0].message.content;
      return generatedQueries
        .split(";")
        .map((entry) => entry.replace(/\n/g, " ").trim())
        .filter((entry) => entry.length > 0)
        .map((entry) => `${entry};`);
    }
    throw new Error("failed to fix sql queries: could not parse responses");
  } catch (err) {
    throw new Error(`failed to fix sql queries: ${(err as Error).message}`);
  }
}

export async function getQueries(apiKey: string, prompt: string, history: ChatMessage[]): Promise<string[]> {
  const acceptedQueries: string[] = [];
  let generatedQueries: string[] = [];
  let failedQueries: string[] = [];
  let attempts = 0;
  do {
    failedQueries = [];
    if (generatedQueries.length == 0) {
      generatedQueries = await generateQueries(apiKey, prompt, history);
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
      generatedQueries = await fixQueries(apiKey, prompt, failedQueries);
    }
    attempts++;
  } while (failedQueries.length != 0 && attempts < 3);
  return acceptedQueries;
}

export async function getResponse(
  apiKey: string,
  prompt: string,
  queryResponses: { success: Record<string, Record<string, any>[]>; fail: string[] },
  history: ChatMessage[]
): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const historyMessages = history
      .map((chatMessage) => ({
        role: chatMessage.isUser ? "user" : "assistant",
        content: chatMessage.message,
      }))
      .slice(-3) as any;
    const instructions = getResponseInstructions(queryResponses);
    console.log(instructions);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: instructions,
        },
        ...historyMessages,
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    if (response?.choices && response.choices.length > 0 && response.choices[0].message?.content) {
      return response.choices[0].message.content;
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
