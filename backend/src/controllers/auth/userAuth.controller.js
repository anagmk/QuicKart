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
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
      socket: { reconnectStrategy: false },
    });

    redisClient.on("error", (err) =>
      console.error("Redis unavailable:", err.message),
    );
  }

  try {
    await redisClient.connect();
  } catch (error) {
    redisClient = null;
    throw new Error(
      "OTP service is unavailable. Configure REDIS_URL or start Redis.",
    );
  }

  return redisClient;
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found. Check email." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "This account has been disabled" });
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

    let referrerId = null;
    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy.trim() });
      if (!referrer) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
      referrerId = referrer._id;
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      referredBy: referrerId,
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

export const resentOtp = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const client = await getRedisClient();

    const signupData = await client.get(`signup:${normalizedEmail}`);
    if (!signupData) {
      return res.status(400).json({
        message: "Signup session expired",
      });
    }

    const cooldown = await client.get(`resend:${normalizedEmail}`);
    if (cooldown) {
      return res.status(429).json({
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await client.set(`otp:${normalizedEmail}`, hashedOtp, {
      EX: 300,
    });

    await client.set(`resend:${normalizedEmail}`, "true", {
      EX: 60,
    });

    await sendOtpEmail(normalizedEmail, otp);

    return res.status(200).json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const client = await getRedisClient();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    await client.set(`resetOtp:${normalizedEmail}`, hashedOtp, {
      EX: 300,
    });

    await client.set(`resetEmail:${normalizedEmail}`, normalizedEmail, {
      EX: 300,
    });

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

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const client = await getRedisClient();
    const storedOtp = await client.get(`resetOtp:${normalizedEmail}`);
    const isOtpValid = storedOtp ? await bcrypt.compare(otp, storedOtp) : false;

    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await client.del(`resetOtp:${normalizedEmail}`);
    await client.set(`resetVerified:${normalizedEmail}`, "true", { EX: 300 });
    return res
      .status(200)
      .json({ message: "OTP verified. Set your new password." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const client = await getRedisClient();
    const verified = await client.get(`resetVerified:${normalizedEmail}`);
    if (!verified) {
      return res
        .status(403)
        .json({ message: "Verify the OTP before resetting your password" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await client.del(`resetVerified:${normalizedEmail}`);
    await client.del(`resetEmail:${normalizedEmail}`);
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    if (typeof req.logout === "function") {
      try {
        await new Promise((resolve, reject) => {
          req.logout((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (error) {
        console.error("Passport logout failed:", error.message);
      }
    }

    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy failed:", err.message);
      });
    }

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const googleCallback = async (req, res) => {
  const token = generateToken({
    id: req.user._id,
    role: req.user.role,
  });

  res.cookie("jwt", token, cookieOptions);

  res.redirect("/user/home");
};
