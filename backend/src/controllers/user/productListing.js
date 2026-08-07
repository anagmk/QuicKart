import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";

// Keep the listing payload safe for products that do not have variants yet.
// Products are created before their first variant/image is added in the admin UI.
export const toListingProduct = (product) => {
  const variants = Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant.isActive !== false)
    : [];
  const firstVariantWithImage = variants.find((variant) =>
    Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0,
  );

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length
    : 0;
  const originalPrice = product.originalPrice ?? 0;
  const sellingPrice = product.offerPrice ?? originalPrice;

  return {
    ...product,
    variants,
    displayImage: firstVariantWithImage?.imageUrls[0] || null,
    displayPrice: sellingPrice,
    rating: { average: Number(averageRating.toFixed(1)), count: reviews.length },
    discountPercentage: originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0,
  };
};

export const getProductDetail = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate("categoryId", "name")
      .lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const listingProduct = toListingProduct(product);
    const relatedProducts = await Product.find({
      isActive: true,
      categoryId: product.categoryId?._id || product.categoryId,
      _id: { $ne: product._id },
    })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return res.status(200).json({
      product: listingProduct,
      relatedProducts: relatedProducts.map(toListingProduct),
    });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Product not found" });
    console.error("getProductDetail error:", error);
    return res.status(500).json({ message: "Unable to load product" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate("categoryId", "name")
      .lean();

    const availableProducts = products.map(toListingProduct);

    return res.status(200).json(availableProducts);
  } catch (error) {
    console.error("getClothingProducts error:", error);
    return res.status(500).json({ message: "Unable to load products" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      size,
      color,
      price,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { isActive: true };
    const variantFilter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.categoryId = category;
    }

    if (size) {
      variantFilter.size = size;
    }

    if (color) {
      variantFilter.color = color;
    }

    if (price) {
      const [min, max] = price.split("-").map(Number);
      if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
        filter.offerPrice = { $gte: min, $lte: max };
      }
    }

    if (size || color) {
      filter.variants = { $elemMatch: variantFilter };
    }

    // Sorting
    let sortOption = {};

    switch (sort) {
      case "latest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "price-asc":
        sortOption = { offerPrice: 1, _id: 1 };
        break;
      case "price-desc":
        sortOption = { offerPrice: -1, _id: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
      .populate("categoryId", "name")
      .sort(sortOption)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ]);

    const availableProducts = products.map(toListingProduct);

    return res.status(200).json({
      products: availableProducts,
      currentPage,
      totalPages: Math.ceil(totalProducts / pageSize),
      totalProducts,
    });
  } catch (error) {
    console.error("getProducts error:", error);
    return res.status(500).json({ message: "Unable to load products" });
  }
};

export const getProductCategories = async (_req, res) => {
  try {
    const categories = await Category.find({ isListed: true })
      .sort({ name: 1 })
      .select("name")
      .lean();

    return res.status(200).json(categories);
  } catch (error) {
    console.error("getProductCategories error:", error);
    return res.status(500).json({ message: "Unable to load categories" });
  }
};

export const productPagination = async (req, res) => {
  try {
    const pageValue = req.query.page ?? "1";
    const limitValue = req.query.limit ?? "10";
    const page = Number(pageValue);
    const limit = Number(limitValue);

    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "page must be a positive integer and limit must be between 1 and 100",
      });
    }

    const filter = { isActive: true };
    const skip = (page - 1) * limit;
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate("categoryId", "name")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const availableProducts = products.map(toListingProduct);

    return res.status(200).json({
      products: availableProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (error) {
    console.error("productPagination error:", error);
    return res.status(500).json({ message: "Unable to load products" });
  }
};
