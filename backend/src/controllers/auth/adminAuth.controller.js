import bcrypt from "bcrypt";
import Admin from "../../models/admin.model.js";
import dotenv from "dotenv";
import generateToken from "../../utils/generateToken.js";

dotenv.config();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 3 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Admin login attempt:", email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found. Check email." });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    if (!admin.isActive) {
      return res
        .status(403)
        .json({ message: "This account has been disabled" });
    }

    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: admin.role,
    });

    res.cookie("adminToken", token, cookieOptions);

    const safeUser = admin.toObject();
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
