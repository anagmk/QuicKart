import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0 },
    sku: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    imageUrls: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const reviewSchema = new mongoose.Schema({
  userName: { type: String, trim: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, default: "" },
}, { timestamps: true });

const offerSchema = new mongoose.Schema({
  code: { type: String, trim: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    offerPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    fit: { type: String, trim: true, default: "" },
    material: { type: String, trim: true, default: "" },
    fabric: { type: String, trim: true, default: "" },
    highlights: [{ type: String, trim: true }],
    offers: [offerSchema],
    reviews: [reviewSchema],
    variants: [variantSchema],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
