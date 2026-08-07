import mongoose from "mongoose";
import Product from "../../models/product.model.js";
import CartItem from "../../models/cart.model.js";
import WishlistItem from "../../models/wishlist.model.js";
import Category from "../../models/category.model.js";

const validId = (id) => mongoose.isValidObjectId(id);
const MAX_QUANTITY_PER_VARIANT = 10;

const productVariant = async (productId, variantId) => {
  if (!validId(productId) || !validId(variantId))
    return { message: "Invalid product or variant" };
  const product = await Product.findById(productId).populate(
    "categoryId",
    "isListed name",
  );
  const variant = product?.variants.id(variantId);
  if (
    !product ||
    !product.isActive ||
    !product.categoryId?.isListed ||
    !variant ||
    !variant.isActive
  ) {
    return { message: "This product variant is unavailable" };
  }
  return { product, variant };
};

const cartPayload = (item) => {
  const product = item.productId;
  const variant = product?.variants?.id
    ? product.variants.id(item.variantId)
    : product?.variants?.find(
        (entry) => String(entry._id) === String(item.variantId),
      );
  const available = Boolean(
    product?.isActive && product?.categoryId?.isListed && variant?.isActive,
  );
  const stock = available ? Number(variant.stock) || 0 : 0;
  const unitPrice = available
    ? (variant.offerPrice ??
      variant.originalPrice ??
      product.offerPrice ??
      product.originalPrice ??
      item.unitPrice)
    : item.unitPrice;
  const quantity = item.quantity;
  return {
    _id: item._id,
    productId: product?._id || item.productId,
    variantId: item.variantId,
    name: product?.name || "Unavailable product",
    image: variant?.imageUrls?.[0] || null,
    color: variant?.color || "—",
    size: variant?.size || "—",
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
    stock,
    available,
    inStock: available && stock >= quantity,
    status: !available
      ? "Unavailable"
      : stock <= 0
        ? "Out of Stock"
        : stock < quantity
          ? `Only ${stock} items left`
          : stock <= 3
            ? `Only ${stock} left`
            : "In Stock",
    maximumQuantity: Math.min(stock, MAX_QUANTITY_PER_VARIANT),
  };
};

export const getCart = async (req, res) => {
  try {
    const items = await CartItem.find({ userId: req.user.id })
      .populate({
        path: "productId",
        populate: { path: "categoryId", select: "name isListed" },
      })
      .sort({ createdAt: -1 });
    const cartItems = items.map(cartPayload);
    const invalidItems = cartItems.filter((item) => !item.inStock);
    return res.status(200).json({
      items: cartItems,
      total: cartItems
        .filter((item) => item.inStock)
        .reduce((sum, item) => sum + item.subtotal, 0),
      checkoutAllowed: cartItems.length > 0 && invalidItems.length === 0,
      message: invalidItems.length
        ? "Remove or update unavailable cart items before checkout."
        : "",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load cart" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const amount = Number(quantity);
    if (
      !validId(productId) ||
      !validId(variantId) ||
      !Number.isSafeInteger(amount) ||
      amount < 1
    ) {
      return res
        .status(400)
        .json({
          message: "A valid product, variant, and quantity are required",
        });
    }
    const { product, variant, message } = await productVariant(
      productId,
      variantId,
    );
    if (message || !variant || variant.stock < amount)
      return res
        .status(400)
        .json({ message: message || `Only ${variant?.stock || 0} items left` });
    const maximumQuantity = Math.min(variant.stock, MAX_QUANTITY_PER_VARIANT);
    const existing = await CartItem.findOne({
      userId: req.user.id,
      productId,
      variantId,
    });
    const newQuantity = (existing?.quantity || 0) + amount;
    if (newQuantity > maximumQuantity)
      return res
        .status(400)
        .json({ message: `You can add a maximum of ${maximumQuantity} items` });
    const unitPrice =
      variant.offerPrice ?? variant.originalPrice ?? product.offerPrice;
    const item = await CartItem.findOneAndUpdate(
      { userId: req.user.id, productId, variantId },
      { $set: { quantity: newQuantity, unitPrice } },
      { upsert: true, new: true, runValidators: true },
    );
    await WishlistItem.deleteOne({ userId: req.user.id, productId });
    return res.status(200).json({ message: "Added to cart", item });
  } catch (error) {
    return res.status(500).json({ message: "Unable to add item to cart" });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(400).json({ message: "Invalid cart item" });

    const quantity = Number(req.body.quantity);

    if (!Number.isSafeInteger(quantity) || quantity < 1)
      return res.status(400).json({ message: "Quantity must be at least 1" });

    const item = await CartItem.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    const { product, variant, message } = await productVariant(
      item.productId,
      item.variantId,
    );
    if (message) return res.status(400).json({ message });
    const maximumQuantity = Math.min(variant.stock, MAX_QUANTITY_PER_VARIANT);

    if (quantity > maximumQuantity)
      return res
        .status(400)
        .json({
          message: maximumQuantity
            ? `Only ${maximumQuantity} items can be added`
            : "Out of Stock",
        });
    item.quantity = quantity;
    item.unitPrice =
      variant.offerPrice ?? variant.originalPrice ?? product.offerPrice;
    await item.save();
    return res.status(200).json({ message: "Cart updated" });

  } catch (error) {
    return res.status(500).json({ message: "Unable to update cart" });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const item = await CartItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!item) return res.status(404).json({ message: "Cart item not found" });
    return res.status(200).json({ message: "Item removed" });

  } catch (error) {
    return res.status(500).json({ message: "Unable to remove cart item" });
  }
};

export const validateCheckout = async (req, res) => {
  try {
    const items = await CartItem.find({ userId: req.user.id }).populate({
      path: "productId",
      populate: { path: "categoryId", select: "isListed" },
    });

    const cartItems = items.map(cartPayload);
    const invalid = cartItems.filter((item) => !item.inStock);

    if (!cartItems.length)
      return res.status(400).json({ message: "Your cart is empty" });
    if (invalid.length)
      return res
        .status(400)
        .json({
          message:
            "Checkout is blocked: some cart items are unavailable or out of stock",
        });
    return res
      .status(200)
      .json({
        message: "Cart is valid for checkout",
        total: cartItems.reduce((sum, item) => sum + item.subtotal, 0),
      });

  } catch (error) {
    return res.status(500).json({ message: "Unable to validate checkout" });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!validId(productId))
      return res.status(400).json({ message: "A valid product is required" });

    const product = await Product.exists({ _id: productId, isActive: true });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const item = await WishlistItem.findOneAndUpdate(
      { userId: req.user.id, productId },
      { $setOnInsert: { userId: req.user.id, productId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return res.status(200).json({ message: "Added to wishlist", item });
    
  } catch (error) {
    return res.status(500).json({ message: "Unable to add item to wishlist" });
  }
};
