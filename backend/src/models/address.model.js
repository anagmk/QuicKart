import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: "" },
    alternatePhone: { type: String, trim: true, default: "" },
    addressType: { type: String, enum: ["Home", "Work"], default: "Home" },
  },
  { timestamps: true },
);

export default mongoose.model("Address", addressSchema);
