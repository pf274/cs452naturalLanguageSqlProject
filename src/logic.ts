import { Parser } from "node-sql-parser";
import OpenAI from "openai";
import initSqlJs, { Database } from "sql.js";
import sqliteUrl from "./assets/sql-wasm.wasm?url";
import { ChatMessage } from "./ChatMessage";
import { getQueryInstructions, getResponseInstructions, initDatabaseCommand } from "./instructions";

class DBState {
  static initialized = false;
  static instance: Database | null = null;
}

async function initDatabase() {
  debugger;
  DBState.initialized = true;
  const SQL = await initSqlJs({
    locateFile: () => sqliteUrl,
  });

  DBState.instance = new SQL.Database();

  const response = DBState.instance.exec(initDatabaseCommand);
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

export async function getQuery(apiKey: string, prompt: string, failedQueries: string[], history: ChatMessage[]): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const historyMessages = history
      .map((chatMessage) => ({
        role: chatMessage.isUser ? "user" : "assistant",
        content: chatMessage.message,
      }))
      .slice(0, 10) as any;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: getQueryInstructions(failedQueries),
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
    throw new Error("failed to generate sql query");
  } catch (err) {
    return `ERROR: ${err}`;
  }
}

export async function getResponse(apiKey: string, prompt: string, query: string, queryResponse: string, history: ChatMessage[]): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const historyMessages = history
      .map((chatMessage) => ({
        role: chatMessage.isUser ? "user" : "assistant",
        content: chatMessage.message,
      }))
      .slice(0, 10) as any;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: getResponseInstructions(query, queryResponse),
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
    throw new Error("failed to generate response");
  } catch (err) {
    return `ERROR: ${err}`;
  }
}

export async function validateQuery(query: string) {
  try {
    const parser = new Parser();
    parser.astify(query);
    return true;
  } catch (error) {
    console.log("Error parsing query:", error);
    return false;
  }
}

export async function runQuery(query: string) {
  try {
    // run the query with sqlite
    const result = DBState.instance!.exec(query);
    return JSON.stringify(result);
  } catch (err) {
    throw new Error(`Error running query: ${query}`);
  }
}
