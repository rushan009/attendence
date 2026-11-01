import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.config.js";
import { autoSeedAdmin } from "./src/utils/seedAdmin.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  await autoSeedAdmin();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();