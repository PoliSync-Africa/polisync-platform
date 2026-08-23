const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected");
    return prisma;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  prisma,
  connectDB,
};
