import { Parser } from "node-sql-parser";
import OpenAI from "openai";
import initSqlJs, { Database } from "sql.js";
import sqliteUrl from "./assets/sql-wasm.wasm?url";
import { ChatMessage } from "./ChatMessage";

class DBState {
  static initialized = false;
  static instance: Database | null = null;
}

async function initDatabase() {
  DBState.initialized = true;
  const SQL = await initSqlJs({
    locateFile: () => sqliteUrl,
  });

  DBState.instance = new SQL.Database();

  const initCommand = `
CREATE TABLE Reviews (
  name varchar(255) COLLATE NOCASE, 
  cuisine varchar(255) COLLATE NOCASE, 
  rating int, 
  review TEXT COLLATE NOCASE
);

INSERT INTO Reviews (name, cuisine, rating, review)
VALUES 
  ('La Cucina Italiana', 'Italian', 4, 'Delicious pasta and pizza, friendly atmosphere.'),
  ('Taco Fiesta', 'Mexican', 5, 'Authentic Mexican flavors, vibrant decor, and excellent service.'),
  ('China Wok', 'Chinese', 4, 'Generous portions, flavorful dishes, and reasonable prices.'),
  ('The Burger Joint', 'American', 3, 'Juicy burgers and crispy fries, but can get crowded on weekends.'),
  ('Sushi Palace', 'Japanese', 5, 'Fresh sushi, friendly staff, and a cozy ambiance.'),
  ('The Greek Grill', 'Greek', 4, 'Authentic Greek dishes, generous portions, and a lively atmosphere.'),
  ('Indian Palace', 'Indian', 5, 'Delicious curries and naan, attentive service, and a variety of vegetarian options.'),
  ('Thai Garden', 'Thai', 4, 'Spicy and flavorful dishes, friendly staff, and a comfortable setting.'),
  ('The French Bistro', 'French', 5, 'Elegant ambiance, exquisite cuisine, and attentive service.'),
  ('The Steakhouse', 'Steakhouse', 4, 'High-quality steaks, extensive wine list, and a classy atmosphere.');

SELECT * FROM Reviews;
`;
  const response = DBState.instance.exec(initCommand);
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
    const response = await openai.models.list();
    console.log(response);
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
          content: `Your job is to create a SQLite query to answer the question. Use the provided database schema to structure your query. You may only respond with the query as a string.

Table Name: Reviews
Fields:
- name: string. The restaurant's name.
- cuisine: string. The restaurant's cuisine type, either 'italian', 'mexican', 'american', or 'chinese'.
- rating: number. The restaurant's rating from 0 to 10, integer.
- review: string. The user's review.

Examples:
To find the average rating for Italian restaurants:
SELECT AVG(rating) FROM RestaurantReviews WHERE cuisine = 'italian';

To summarize the reviews for a specific restaurant:
SELECT review FROM RestaurantReviews WHERE name = 'The Best Italian Restaurant';
${failedQueries.length > 0 ? `\nQueries you generated that did not work: ${failedQueries.join("\n ")}` : ""}
`,
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
          content: `You are a helpful assistant that helps a user find a great restaurant. The restaurants' information is kept in a database with this sql schema:
Table Name: Reviews
Fields:
- name: string. The restaurant's name.
- cuisine: string. The restaurant's cuisine type, either 'italian', 'mexican', 'american', or 'chinese'.
- rating: number. The restaurant's rating from 0 to 10, integer.
- review: string. The user's review.

This query returns the necessary information:
${query}
This is the query's response:
${queryResponse}

Do not mention the existence of a database or SQL queries in your response.
`,
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
    throw new Error(`Error running query: ${err}`);
  }
}
