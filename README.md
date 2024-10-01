# CS 452 Natural Language SQL Project

[See Website](https://pf274.github.io/cs452naturalLanguageSqlProject)

## Summary

In this project I designed a database and created a natural language interface to it using OpenAI's LLM API.

## Objective

Build an app that can ask questions of ChatGPT and get answers in the form of SQL queries to your database. Take the results of the queries (if they worked) and get ChatGPT to give a friendly answer using the results from the query on your database. Question -> GPT -> SQL -> Results -> GPT -> Friendly response. It doesn't need to have a GUI or be interactive.

## How this works

The OpenAI Logic lives in `src/logic.ts`. This file contains every function needed for database initialization, openAI communication, and query validation.

The bulk of the User Interface is in `src/App.tsx`. This manages input from the user, passing prompts to `src/logic.ts`, then displaying the results using the ChatMessage class and functional component located in `src/ChatMessage.tsx`

Getting Sqlite working with vite and github pages was a bit tricky. In short, setting up sqlite requires a `.wasm` file, which it needs to initialize and maintain a database. Once configuring vite to include wasm files as resources, you can import and work with wasm files by appending `?url` to the filepath. After setting up the database instance, initialization SQL commands can be run to import all the data needed to run the restaurant agent. You can see all this working in `src/logic.ts`.

Since the user must input their own api key before using the website, no sensitive information is exposed to the user or in the code.
