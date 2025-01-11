import { PrismaClient } from '@prisma/client';

let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: ["error", "query", "info", "warn"],
  });
}
prisma = global.prisma;

async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to the database.");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  }
}

connectToDatabase();

export default prisma;