import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import mongoose from "mongoose";

const validId = (id) => mongoose.isValidObjectId(id);
const productData = (body) => ({
  name: String(body.name || "").trim(),
  description: String(body.description || "").trim(),
  categoryId: body.categoryId,
  originalPrice: Number(body.originalPrice),
  offerPrice: body.offerPrice === "" || body.offerPrice == null ? Number(body.originalPrice) : Number(body.offerPrice),
});

const validateProduct = async (data) => {
  if (!data.name || !data.description || !validId(data.categoryId) || !Number.isFinite(data.originalPrice) || data.originalPrice < 0) {
    return "Name, description, category, and a valid original price are required";
  }
  if (data.offerPrice !== undefined && (!Number.isFinite(data.offerPrice) || data.offerPrice < 0 || data.offerPrice > data.originalPrice)) {
    return "Offer price must be between 0 and the original price";
  }
  return (await Category.exists({ _id: data.categoryId, isListed: true })) ? null : "Select a valid listed category";
};

export const addProduct = async (req, res) => {
  try {
    const data = productData(req.body);
    const message = await validateProduct(data);
    if (message) return res.status(400).json({ message });
    const product = new Product(data);
    // Ensure variants is always a fresh array for new products
    product.variants = [];

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("categoryId");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "categoryId",
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const data = productData(req.body);
    const message = await validateProduct(data);
    if (message) return res.status(400).json({ message });
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, data);

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchProductsByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      res.status(400).json({ message: "Name query parameter is required" });
      return;
    }
    const product = await Product.find({
      name: { $regex: name, $options: "i" },
    }).populate("categoryId");
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const blockProduct = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const { blocked } = req.body; // expected boolean; if omitted, toggle
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (typeof blocked === 'boolean') {
      product.isActive = !blocked ? true : false;
    } else {
      product.isActive = !product.isActive;
    }
    await product.save();
    res.status(200).json({ message: product.isActive ? 'Product unblocked' : 'Product blocked', product });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const addVariant = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const { color, size, stock, originalPrice, offerPrice, description = "" } = req.body;
    const imageUrls = (req.files || []).map((file) => file.path).filter(Boolean);
    // Build a fresh variant object (avoid sharing references)
    const variant = JSON.parse(JSON.stringify({
      color: String(color || "").trim(),
      size: String(size || "").trim(),
      stock: Number(stock),
      originalPrice: Number(originalPrice),
      offerPrice: offerPrice === "" || offerPrice == null ? undefined : Number(offerPrice),
      description: String(description).trim(),
      imageUrls,
    }));
    if (!variant.color || !variant.size || !Number.isFinite(variant.stock) || variant.stock < 0 || !Number.isFinite(variant.originalPrice) || variant.originalPrice < 0 || (variant.offerPrice !== undefined && (!Number.isFinite(variant.offerPrice) || variant.offerPrice < 0 || variant.offerPrice > variant.originalPrice))) {
      return res.status(400).json({ message: "Enter valid color, size, stock, and prices" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.variants.push(variant);
    await product.save();
    res.status(201).json(product.variants.at(-1));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteVariant = async (req, res) => {
  try {
    if (!validId(req.params.id) || !validId(req.params.variantId)) return res.status(400).json({ message: "Invalid ID" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found" });
    variant.deleteOne();
    await product.save();
    res.status(200).json({ message: "Variant deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
