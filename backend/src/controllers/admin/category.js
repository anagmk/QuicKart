import categoryModel from "../../models/category.model.js";
import mongoose from "mongoose";

const getCategoryName = (body) =>
  typeof body?.name === "string" ? body.name.trim() : "";

const handleCategoryError = (error, res) => {
  if (error?.code === 11000) {
    return res.status(409).json({ message: "Category name already exists" });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

const validateCategoryId = (id, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid category ID" });
    return false;
  }

  return true;
};

export const addCategory = async (req, res) => {
  try {
    const name = getCategoryName(req.body);
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = new categoryModel({ name });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    return handleCategoryError(error, res);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find();
    res.status(200).json(categories);
  } catch (error) {
    return handleCategoryError(error, res);
  }
};

export const getCategoryById = async (req, res) => {
  try {
    if (!validateCategoryId(req.params.id, res)) return;

    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    return handleCategoryError(error, res);
  }
};

export const editCategory = async (req, res) => {
  try {
    if (!validateCategoryId(req.params.id, res)) return;

    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const name = getCategoryName(req.body);
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    category.name = name;
    if (typeof req.body.isListed === "boolean") {
      category.isListed = req.body.isListed;
    }
    await category.save();
    return res.status(200).json(category);
  } catch (error) {
    return handleCategoryError(error, res);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    if (!validateCategoryId(req.params.id, res)) return;

    const category = await categoryModel.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return handleCategoryError(error, res);
  }
};

export const searchCategoriesByName = async (req, res) => {
  try{
    const query = req.query.q?.trim();
    if(!query){
      const categories = await categoryModel.find().sort({ createdAt: -1 });
      return res.status(200).json(categories);
    }

    const categories = await categoryModel.find({
      name: { $regex: query, $options: "i" },
    }).sort({ createdAt: -1 });

    return res.status(200).json(categories);
  }catch(error){
    return res.status(500).json({ message: error.message });
  }
};

export const paginateCategories = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const totalCategories = await categoryModel.countDocuments();

        const categories = await categoryModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            categories,
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit),
            totalCategories
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const sortCategories = async (req, res) => {
  try{
    const sort = req.query.sort;
    let query = categoryModel.find();

    if(sort === "latest"){
      query = query.sort({ createdAt: -1 });
    }

    const categories = await query;

    res.status(200).json({categories, message: "Categories sorted successfully" });
  }catch(error){
    res.status(500).json({message: error.message});
  }
};
