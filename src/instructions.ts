const databaseDescription = `Database:
CREATE TABLE Restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurantName varchar(255),
  overallRating REAL
);

CREATE TABLE Reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurantName varchar(255),
  rating INTEGER,
  review TEXT,
  reviewer varchar(255),
  FOREIGN KEY(restaurantName) REFERENCES Restaurants(restaurantName)
);

CREATE TABLE RestaurantContactInfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurantName varchar(255) COLLATE NOCASE,
  address varchar(255) COLLATE NOCASE,
  phone varchar(12) COLLATE NOCASE,
  email varchar(100) COLLATE NOCASE,
  website varchar(100) COLLATE NOCASE,
  FOREIGN KEY(restaurantName) REFERENCES Restaurants(restaurantName)
);
`;

export function getQueryInstructions() {
  return `Your job is to create SQLite queries to answer the user's question in context of the conversation. Use the provided database schema to structure your queries. You may only respond with queries as a string. You may only retrieve a maximum of ten rows per query. Each query should end with a semicolon AND SHOULD RETURN ALL FIELDS.
${databaseDescription}

To find the average rating for a restaurant (Example):
SELECT overallRating FROM Restaurants WHERE restaurantName="Taco Bell"

To summarize the reviews for a specific restaurant (Example):
SELECT * FROM Reviews WHERE restaurantName="Old Spaghetti Factory";

To count the total number of restaurants:
SELECT COUNT(DISTINCT names) FROM Reviews;

To find out which restaurants serve noodles (Example) (searching the 'review' field specifically):
SELECT DISTINCT restaurantName FROM Reviews WHERE review LIKE '%noodle%';

To find out what a restaurant sells (Example):
SELECT * FROM Reviews where restaurantName="In N Out";

To find out what people have said about the salad at a restaurant (Example):
SELECT * FROM Reviews WHERE review LIKE '%salad%' AND restaurantName="Subway";
`.trim();
}

export function getFixQueryInstructions(failedQueries: string[]) {
  return `Your job is to fix SQLite queries to answer the user's question. Use the provided database schema to structure your queries. You may only respond with queries as a string. You may only retrieve a maximum of ten rows per query. Each query should end with a semicolon.

${databaseDescription}

${failedQueries.length > 0 ? `Failed Queries you need to fix:\n${failedQueries.join("\n ")}` : ""}
`.trim();
}

export function getResponseInstructions(queryResponses: { success: Record<string, Record<string, any>[]>; fail: string[] }) {
  const limitedQueryResponses = JSON.parse(JSON.stringify(queryResponses));
  if (limitedQueryResponses.success.length > 10) {
    limitedQueryResponses.success = limitedQueryResponses.success.slice(0, 10);
  }
  for (const key in limitedQueryResponses.success) {
    if (limitedQueryResponses.success[key].length > 10) {
      limitedQueryResponses.success[key] = limitedQueryResponses.success[key].slice(0, 10);
    }
  }
  if (limitedQueryResponses.fail.length > 10) {
    limitedQueryResponses.fail = limitedQueryResponses.fail.slice(0, 10);
  }
  return `You are a helpful assistant that helps a user find a great restaurant by answering their questions in context of the conversation. The restaurants' information is kept in a database with this sql schema:

${databaseDescription}

These are some relevant queries and their responses:
${JSON.stringify(limitedQueryResponses, null, 2)}

Do not mention the existence of a database or SQL queries in your response.
If looking at multiple reviews, summarize what they say to be concise in your response.
If you don't have enough information from the database queries, don't make stuff up. Just say you don't know.
`.trim();
}
