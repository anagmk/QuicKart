import User from "../../models/user.model.js";
import bcrypt from "bcrypt";
import { createClient } from "redis";
import { sendOtpEmail } from "../../services/otp.service.js";
import { sendSMS } from "../../services/twilio.js";
import generateToken from "../../utils/generateToken.js";

let redisClient = null;

const getRedisClient = async () => {
  if (redisClient?.isOpen) return redisClient;

  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
      socket: { reconnectStrategy: false },
    });
    redisClient.on("error", (error) =>
      console.error("Redis unavailable:", error.message),
    );
  }

  try {
    await redisClient.connect();
  } catch {
    redisClient = null;
    throw new Error("OTP service is unavailable. Configure REDIS_URL or start Redis.");
  }

  return redisClient;
};

const changeEmailKey = (userId) => `changeEmail:${userId}`;
const changeEmailOtpKey = (userId) => `changeEmailOtp:${userId}`;
const changePhoneKey = (userId) => `changePhone:${userId}`;
const changePhoneOtpKey = (userId) => `changePhoneOtp:${userId}`;

const createAndSendChangeEmailOtp = async (userId, email) => {
  const client = await getRedisClient();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await client.set(changeEmailKey(userId), email, { EX: 300 });
  await client.set(changeEmailOtpKey(userId), await bcrypt.hash(otp, 10), {
    EX: 300,
  });
  await sendOtpEmail(email, otp);
};

const createAndSendChangePhoneOtp = async (userId, phone) => {
  const client = await getRedisClient();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await client.set(changePhoneKey(userId), phone, { EX: 300 });
  await client.set(changePhoneOtpKey(userId), await bcrypt.hash(otp, 10), {
    EX: 300,
  });
  await sendSMS(phone, otp);
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "Choose an image to upload" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.path },
      { new: true },
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Profile photo updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile image upload failed:", error);
    return res.status(500).json({ message: "Unable to upload profile photo" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword} = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and old password is same. Please choose a different password",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.googleId) {
      return res.status(403).json({
        success: false,
        message: "Google login users cannot change their password",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, gender } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email.toLowerCase() !== user.email) {
      return res.status(400).json({
        success: false,
        message: "Use the change email flow to update your email address",
      });
    }

    if (phone && phone !== user.mobile) {
      return res.status(400).json({
        success: false,
        message: "Use the phone verification flow to update your phone number",
      });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }
      user.name = trimmedName;
    }
    if (gender !== undefined) user.gender = gender;

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const requestEmailChange = async (req, res) => {
  try {
    const currentEmail = req.body.currentEmail?.trim().toLowerCase();
    const newEmail = req.body.newEmail?.trim().toLowerCase();

    if (!currentEmail || !newEmail) {
      return res.status(400).json({ message: "Current and new email are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.googleId) {
      return res.status(403).json({ message: "Google accounts cannot change their email address here" });
    }
    if (user.email !== currentEmail) {
      return res.status(400).json({ message: "Current email does not match your account" });
    }
    if (currentEmail === newEmail) {
      return res.status(400).json({ message: "Enter a different email address" });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(409).json({ message: "That email address is already in use" });
    }

    await createAndSendChangeEmailOtp(req.user.id, newEmail);
    return res.status(200).json({ message: "OTP sent to your new email address" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to send OTP" });
  }
};

export const resendEmailChangeOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("googleId");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.googleId) {
      return res.status(403).json({ message: "Google accounts cannot change their email address here" });
    }

    const client = await getRedisClient();
    const newEmail = await client.get(changeEmailKey(req.user.id));
    if (!newEmail) {
      return res.status(400).json({ message: "Email change session expired. Start again." });
    }

    await createAndSendChangeEmailOtp(req.user.id, newEmail);
    return res.status(200).json({ message: "A new OTP was sent to your new email address" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to resend OTP" });
  }
};

export const verifyEmailChangeOtp = async (req, res) => {
  try {
    const otp = String(req.body.otp || "");
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter the six-digit OTP" });
    }

    const client = await getRedisClient();
    const user = await User.findById(req.user.id).select("googleId");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.googleId) {
      return res.status(403).json({ message: "Google accounts cannot change their email address here" });
    }

    const [newEmail, storedOtp] = await Promise.all([
      client.get(changeEmailKey(req.user.id)),
      client.get(changeEmailOtpKey(req.user.id)),
    ]);
    const validOtp = storedOtp && (await bcrypt.compare(otp, storedOtp));
    if (!newEmail || !validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existingUser = await User.findOne({ email: newEmail, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(409).json({ message: "That email address is already in use" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, { email: newEmail }, { new: true });
    await Promise.all([
      client.del(changeEmailKey(req.user.id)),
      client.del(changeEmailOtpKey(req.user.id)),
    ]);

    const token = generateToken({ id: updatedUser._id, email: updatedUser.email, role: updatedUser.role });
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.status(200).json({ message: "Email address updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to verify OTP" });
  }
};

export const requestPhoneChange = async (req, res) => {
  try {
    const phone = String(req.body.phone || "").trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return res.status(400).json({
        message: "Enter a valid phone number with country code, for example +919876543210",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (phone === user.mobile) {
      return res.status(400).json({ message: "Enter a different phone number" });
    }

    const existingUser = await User.findOne({ mobile: phone, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(409).json({ message: "That phone number is already in use" });
    }

    await createAndSendChangePhoneOtp(req.user.id, phone);
    return res.status(200).json({ message: "OTP sent to your new phone number" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to send OTP" });
  }
};

export const resendPhoneChangeOtp = async (req, res) => {
  try {
    const client = await getRedisClient();
    const phone = await client.get(changePhoneKey(req.user.id));
    if (!phone) {
      return res.status(400).json({ message: "Phone change session expired. Start again." });
    }

    await createAndSendChangePhoneOtp(req.user.id, phone);
    return res.status(200).json({ message: "A new OTP was sent to your new phone number" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to resend OTP" });
  }
};

export const verifyPhoneChangeOtp = async (req, res) => {
  try {
    const otp = String(req.body.otp || "");
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter the six-digit OTP" });
    }

    const client = await getRedisClient();
    const [phone, storedOtp] = await Promise.all([
      client.get(changePhoneKey(req.user.id)),
      client.get(changePhoneOtpKey(req.user.id)),
    ]);
    const validOtp = storedOtp && (await bcrypt.compare(otp, storedOtp));
    if (!phone || !validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existingUser = await User.findOne({ mobile: phone, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(409).json({ message: "That phone number is already in use" });
    }

    await User.findByIdAndUpdate(req.user.id, { mobile: phone });
    await Promise.all([
      client.del(changePhoneKey(req.user.id)),
      client.del(changePhoneOtpKey(req.user.id)),
    ]);
    return res.status(200).json({ message: "Phone number updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to verify OTP" });
  }
};
