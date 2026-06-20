import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

// Each service loads its own .env from its working directory
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}
