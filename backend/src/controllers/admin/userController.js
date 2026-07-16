import Users from "../../models/user.model.js";

export const allUsers = async (req, res) => {
  try {
    const users = await Users.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isActive = false;
    await user.save();
    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sortUsers = async (req, res) => {
  try {
    const sort = req.query.sort;

    let query = Users.find();

    if (sort === "latest") {
      query = query.sort({ createdAt: -1 });
    }

    const users = await query;

    res.status(200).json({users, message: "Users sorted successfully" });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const paginateUsers = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const totalUsers = await Users.countDocuments();

        const users = await Users.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};