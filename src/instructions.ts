const databaseDescription = `Table Name: Reviews
Fields:
- name: string. The restaurant's name.
- cuisine: string. The restaurant's cuisine type, such as 'italian'.
- rating: number. The restaurant's rating from 0 to 5, integer.
- review: string. The user's review.`;

export function getQueryInstructions() {
  return `Your job is to create SQLite queries to answer the user's question. Use the provided database schema to structure your queries. You may only respond with queries as a string. You may only retrieve a maximum of ten rows per query. Each query should end with a semicolon.

${databaseDescription}

Examples:
To find the average rating for Italian restaurants:
SELECT AVG(rating) FROM Reviews WHERE cuisine = 'italian';

To summarize the reviews for a specific restaurant:
SELECT review FROM Reviews WHERE name = 'The Best Italian Restaurant';
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
`.trim();
}

export const initDatabaseCommand = `
CREATE TABLE Reviews (
  name varchar(255) COLLATE NOCASE, 
  cuisine varchar(255) COLLATE NOCASE, 
  rating int, 
  review TEXT COLLATE NOCASE
);

INSERT INTO Reviews (name, cuisine, rating, review)
VALUES 
  ('China Wok', 'Chinese', 4, 'China Wok is a great spot for a quick and satisfying Chinese meal. The portions are generous, the food is flavorful, and the prices are reasonable. I particularly enjoyed the sweet and sour chicken and the vegetable fried rice. The atmosphere is casual and relaxed.'),
  ('Chinese Garden', 'Chinese', 4, 'Chinese Garden is a great option for a quick and satisfying Chinese meal. Their lo mein is always cooked to perfection, and their egg rolls are crispy and delicious. The atmosphere is casual and relaxed, perfect for a solo lunch or a casual dinner.'),
  ('Ethiopian Cuisine', 'Ethiopian', 5, 'A flavorful and unique dining experience with a variety of stews and injera bread. The food is delicious, and the atmosphere is friendly and welcoming.'),
  ('Farm-to-Table Cuisine', 'American', 5, 'A fresh and seasonal dining experience with locally sourced ingredients. The food is delicious and nutritious, and the atmosphere is casual and welcoming.'),
  ('Filipino Cuisine', 'Filipino', 4, 'A hearty and flavorful dining experience with a variety of traditional Filipino dishes. The food is delicious, and the atmosphere is casual and friendly.'),
  ('Fusion Cuisine', 'Fusion', 5, 'An exciting and flavorful dining experience with a variety of fusion dishes. The food is delicious and innovative, and the atmosphere is lively and energetic.'),
  ('Gluten-Free Delights', 'Gluten-Free', 5, 'A delicious and satisfying dining experience with a variety of gluten-free options. The food is flavorful and well-prepared, and the atmosphere is casual and friendly.'),
  ('Greek Tavern', 'Greek', 4, 'Greek Tavern is a great place to experience authentic Greek cuisine. Their gyros are always cooked to perfection, and their tzatziki sauce is delicious. The atmosphere is lively and energetic, perfect for a night out with friends.'),
  ('Indian Cuisine', 'Indian', 5, 'Indian Cuisine is a must-try for lovers of Indian food. Their curries are rich and flavorful, and their naan is soft and fluffy. The service is friendly and attentive, and the atmosphere is cozy and inviting.'),
  ('Indian Palace', 'Indian', 5, 'Indian Palace is a must-visit for lovers of Indian food. The curries are rich and flavorful, the naan is soft and fluffy, and the service is attentive. There is also a wide variety of vegetarian options available. I highly recommend the chicken tikka masala and the vegetable biryani.'),
  ('Korean Barbecue', 'Korean', 5, 'A fun and interactive dining experience where you''ll grill your own meat and vegetables at the table. The food is delicious, and the atmosphere is lively and energetic.'),
  ('La Cucina Italiana', 'Italian', 4, 'The pasta at La Cucina Italiana is simply divine! I had the carbonara and it was creamy, flavorful, and cooked to perfection. The atmosphere is cozy and inviting, perfect for a romantic dinner or a night out with friends.'),
  ('Mexican Grill', 'Mexican', 5, 'Mexican Grill is a must-try for authentic Mexican cuisine. Their burritos are packed with flavor and their chips and salsa are top-notch. The service is friendly and attentive, and the decor is colorful and festive.'),
  ('Peruvian Cuisine', 'Peruvian', 5, 'A delicious and vibrant dining experience with a fusion of Spanish, African, and indigenous Peruvian flavors. The food is fresh and flavorful, and the atmosphere is lively and energetic.'),
  ('Pizza Palace', 'Italian', 4, 'Pizza Palace is my go-to spot for a delicious and cheesy pizza. They have a wide variety of toppings to choose from, and their crust is always perfectly cooked. The atmosphere is casual and friendly, perfect for a family night out.'),
  ('Raw Food Restaurant', 'Raw', 5, 'A healthy and nutritious dining experience with a variety of raw food dishes. The food is flavorful and creative, and the atmosphere is peaceful and relaxing.'),
  ('Sushi Bar', 'Japanese', 5, 'Sushi Bar is a must-visit for sushi lovers. Their sushi is fresh and flavorful, and their rolls are creatively prepared. The service is friendly and attentive, and the atmosphere is cozy and inviting.'),
  ('Sushi Palace', 'Japanese', 5, 'Sushi Palace is my go-to spot for fresh and delicious sushi. The fish is high quality and the rolls are expertly prepared. The staff is friendly and attentive, and the atmosphere is cozy and inviting. I highly recommend the dragon roll and the spicy tuna nigiri.'),
  ('Taco Fiesta', 'Mexican', 5, 'Taco Fiesta is a hidden gem! The tacos are authentic and delicious, with a variety of fillings to choose from. The salsa bar is a must-try, with a range of spicy and mild options. The service is friendly and attentive, and the decor is vibrant and colorful.'),
  ('Thai Garden', 'Thai', 4, 'Thai Garden is a great spot for a spicy and flavorful Thai meal. The dishes are authentic and well-prepared, and the service is friendly and efficient. I particularly enjoyed the pad thai and the green curry. The atmosphere is casual and relaxed.'),
  ('Thai Kitchen', 'Thai', 4, 'Thai Kitchen is a great spot for a spicy and flavorful Thai meal. Their pad thai is always cooked to perfection, and their green curry is full of flavor. The atmosphere is casual and relaxed, perfect for a quick lunch or a casual dinner.'),
  ('The Burger Joint', 'American', 3, 'The Burger Joint is a popular spot for a juicy burger and fries. The burgers are cooked to order and are packed with flavor. The fries are crispy and golden brown. However, it can get quite crowded on weekends, so be prepared to wait for a table.'),
  ('The Burger Shack', 'American', 3, 'The Burger Shack is a local favorite for juicy burgers and crispy fries. Their burgers are made with fresh, high-quality ingredients, and their fries are perfectly seasoned. The atmosphere is laid-back and casual, perfect for a casual night out.'),
  ('The Dark Dining Experience', 'Fusion', 4, 'A unique and challenging dining experience where you''ll have to rely solely on your taste buds and sense of touch. The food is good, and the experience is unforgettable.'),
  ('The Dinner Detective', 'Fusion', 4, 'A fun and interactive dining experience where you''ll need to solve a crime while enjoying a delicious meal. The food is good, and the entertainment is top-notch.'),
  ('The French Bistro', 'French', 5, 'The French Bistro is a luxurious and elegant restaurant that offers exquisite French cuisine. The food is beautifully presented and the flavors are exceptional. The service is attentive and professional, and the atmosphere is sophisticated and refined. I highly recommend the escargots and the steak au poivre.'),
  ('The French Cafe', 'French', 5, 'The French Cafe is a luxurious and elegant restaurant that offers exquisite French cuisine. Their food is beautifully presented and the flavors are exceptional. The service is attentive and professional, and the atmosphere is sophisticated and refined.'),
  ('The Greek Grill', 'Greek', 4, 'The Greek Grill is a great place to experience authentic Greek cuisine. The portions are generous, the food is flavorful, and the atmosphere is lively. I particularly enjoyed the gyros and the moussaka. The service is friendly and efficient.'),
  ('The Robot Restaurant', 'Fusion', 5, 'A futuristic and entertaining dining experience with robotic servers and a high-tech atmosphere. The food is good, and the show is amazing.'),
  ('The Steakhouse Grill', 'Steakhouse', 4, 'The Steakhouse Grill is a great place to enjoy a high-quality steak. Their steaks are cooked to perfection and the sides are delicious. The wine list is extensive and well-curated. The atmosphere is classy and sophisticated, making it a perfect spot for a special occasion.'),
  ('The Steakhouse', 'Steakhouse', 4, 'The Steakhouse is a great place to enjoy a high-quality steak. The steaks are cooked to perfection and the sides are delicious. The wine list is extensive and well-curated. The atmosphere is classy and sophisticated, making it a perfect spot for a special occasion.'),
  ('The Treehouse Restaurant', 'American', 5, 'A charming and romantic restaurant with a cozy treehouse atmosphere. The food is delicious, and the views are breathtaking.'),
  ('The Underground Supper Club', 'Fusion', 5, 'A truly unique dining experience with a secret location and a rotating menu of gourmet dishes. The food is exceptional, and the atmosphere is intimate and mysterious.'),
  ('Vegan Gourmet', 'Vegan', 5, 'A delicious and innovative dining experience with a variety of vegan dishes. The food is flavorful and creative, and the atmosphere is casual and relaxed.'),
  ('Vietnamese Cuisine', 'Vietnamese', 5, 'A fresh and flavorful dining experience with a variety of Vietnamese dishes. The food is delicious, and the atmosphere is casual and relaxed.');

SELECT * FROM Reviews;
`;
