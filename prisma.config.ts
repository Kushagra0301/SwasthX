import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config(); // 👈 THIS LOADS .env

export default defineConfig({
  schema: "prisma/schema.prisma",
});
