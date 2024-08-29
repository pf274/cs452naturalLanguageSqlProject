const databaseDescription = `Database:
CREATE TABLE Restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurantName varchar(255) COLLATE NOCASE,
  overallRating REAL
);

CREATE TABLE Reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurantId INTEGER,
  rating INTEGER,
  review TEXT COLLATE NOCASE,
  reviewer varchar(255) COLLATE NOCASE,
  FOREIGN KEY(restaurantId) REFERENCES Restaurants(id)
);`;

export function getQueryInstructions() {
  return `Your job is to create SQLite queries to answer the user's question. Use the provided database schema to structure your queries. You may only respond with queries as a string. You may only retrieve a maximum of ten rows per query. Each query should end with a semicolon.

${databaseDescription}

Examples:
To find the average rating for Italian restaurants:
SELECT AVG(rating) FROM Reviews WHERE review LIKE '%italian%';

To summarize the reviews for a specific restaurant:
SELECT review FROM Reviews WHERE name = 'The Best Italian Restaurant';

To count the total number of restaurants:
SELECT COUNT(DISTINCT names) FROM Reviews;

To find out which restaurants serve noodles: (searching the 'review' field specifically)
SELECT DISTINCT r.restaurantName FROM Restaurants r JOIN Reviews rv ON r.id = rv.restaurantId WHERE rv.review LIKE '%noodle%';

To find out what a restaurant sells:
SELECT review FROM Reviews rv JOIN Restaurants r ON r.id = rv.restaurantID where r.restaurantName = "Taco Bell";

To find out what people have said about the salad at a restaurant:
SELECT rv.review FROM Reviews rv JOIN Restaurants r ON r.id = rv.restaurantId WHERE rv.review LIKE '%salad%' AND r.restaurantName = "Taco Bell";
`.trim();
}

export function getFixQueryInstructions(failedQueries: string[]) {
  return `Your job is to fix SQLite queries to answer the user's question. Use the provided database schema to structure your queries. You may only respond with queries as a string. You may only retrieve a maximum of ten rows per query. Each query should end with a semicolon.

${databaseDescription}

${failedQueries.length > 0 ? `Failed Queries you need to fix:\n${failedQueries.join("\n ")}` : ""}
`.trim();
}

export function getResponseInstructions(queryResponses: { success: Record<string, Record<string, any>[]>; fail: string[] }) {
  return `You are a helpful assistant that helps a user find a great restaurant. The restaurants' information is kept in a database with this sql schema:

${databaseDescription}

These are some relevant queries and their responses:
${JSON.stringify(queryResponses, null, 2)}

Do not mention the existence of a database or SQL queries in your response.
If looking at multiple reviews, summarize what they say to be concise in your response.
`.trim();
}
