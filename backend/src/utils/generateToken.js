import jwt from "jsonwebtoken";

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    // Keep the signed token aligned with each role's browser cookie lifetime.
    expiresIn: payload.role === "admin" ? "3d" : "7d",
  });
};

export default generateToken;
