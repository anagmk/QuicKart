import bcrypt from "bcrypt";
import User from "../../models/user.model.js";
import dotenv from "dotenv";
import generateToken from "../../utils/generateToken.js";
import { sendOtpEmail } from "../../services/otp.service.js";
import { createClient } from "redis";

dotenv.config();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000,
  path: "/",
};

let redisClient = null;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    });

    redisClient.on("error", (err) => console.error("Redis Client Error", err));
    await redisClient.connect();
  }

  return redisClient;
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

export const signup = async (req, res) => {
  try {
    const { name, email, password, referredBy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const client = await getRedisClient();
    const normalizedEmail = email.toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await client.set(`otp:${normalizedEmail}`, hashedOtp, {
      EX: 300,
    });

    await client.set(
      `signup:${normalizedEmail}`,
      JSON.stringify({
        name,
        email: normalizedEmail,
        password,
        referredBy,
      }),
      {
        EX: 300,
      },
    );

    await sendOtpEmail(normalizedEmail, otp);

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const client = await getRedisClient();

    const signupDataRaw = await client.get(`signup:${normalizedEmail}`);
    if (!signupDataRaw) {
      return res.status(400).json({
        message: "Signup session expired",
      });
    }

    const { name, password, referredBy } = JSON.parse(signupDataRaw);

    const storedOtp = await client.get(`otp:${normalizedEmail}`);
    const isOtpValid = storedOtp ? await bcrypt.compare(otp, storedOtp) : false;
    if (!isOtpValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    await client.del(`otp:${normalizedEmail}`);
    await client.del(`signup:${normalizedEmail}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      referredBy,
    });

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.cookie("jwt", token, cookieOptions);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to verify OTP",
    });
  }
};