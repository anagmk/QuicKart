import dotenv from "dotenv";

dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT;

const server = async () => {
  try {
    await connectDB;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

server();


