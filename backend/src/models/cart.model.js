import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

cartItemSchema.index({ userId: 1, productId: 1, variantId: 1 }, { unique: true });

export default mongoose.model("CartItem", cartItemSchema);
