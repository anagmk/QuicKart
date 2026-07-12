import bcrypt from "bcrypt";
import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import generateToken from "../../utils/generateToken.js";

dotenv.config();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000,
  path: "/",
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, referredBy } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      referredBy,
    });

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Check email." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.cookie("jwt", token, cookieOptions);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
      accessToken: token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
