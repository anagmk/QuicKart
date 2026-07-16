import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import connectDB from "../src/config/db.js";
import Admin from "../src/models/admin.model.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB;

    const existingAdmin = await Admin.findOne({
      email: "admin@quickart.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await Admin.create({
      email: "admin@quickart.com",
      password: hashedPassword,
      isActive: true,
    });

    console.log("Admin created successfully");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();