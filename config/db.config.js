// const PrismaClient = require("@prisma/client").PrismaClient;
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "query", "info", "warn"],
});

async function connectToDatabase() {
  try {
    await prisma.$connect(); // Initiates connection to the database
    console.log("✅ Successfully connected to the database.");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1); // Exit the process on a failed connection
  }
}

// Call the function to connect and log
connectToDatabase();

// module.exports = prisma;
export default prisma
