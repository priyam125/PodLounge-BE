import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL; // Ensure DATABASE_URL is set in your .env file
let client;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log("✅ Successfully connected to the Mongodb database.");
  }
  return client.db(); // Return the database instance
}