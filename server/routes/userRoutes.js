const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    return res.json(req.user);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/wishlist", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "wishlist",
      "name brand price image category stock rating numReviews"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.wishlist || []);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/wishlist/:productId", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = user.wishlist.some(
      (id) => id.toString() === product._id.toString()
    );

    if (exists) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(product._id);

    await user.save();

    return res.status(201).json({ message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/wishlist/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const beforeLength = user.wishlist.length;

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.productId
    );

    if (user.wishlist.length === beforeLength) {
      return res
        .status(404)
        .json({ message: "Product not found in wishlist" });
    }

    await user.save();

    return res.json({ message: "Product removed from wishlist" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    return res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protect, admin, async (req, res) => {
  try {
    const search = req.query.q ? req.query.q.trim() : "";
    const role = req.query.role ? req.query.role.trim() : "";
    const active = req.query.active ? req.query.active.trim() : "";
    const page = Number(req.query.page) || 0;
    const pageSize = Number(req.query.pageSize) || 0;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role === "admin") {
      filter.isAdmin = true;
    } else if (role === "user") {
      filter.isAdmin = false;
    }

    if (active === "true") {
      filter.isActive = true;
    } else if (active === "false") {
      filter.isActive = false;
    }

    if (!page || !pageSize) {
      const users = await User.find(filter).select("-password");
      return res.json(users);
    }

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-password")
      .sort("-createdAt")
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      users,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (typeof req.body.isAdmin === "boolean") {
      user.isAdmin = req.body.isAdmin;
    }

    if (typeof req.body.isActive === "boolean") {
      user.isActive = req.body.isActive;
    }

    const updatedUser = await user.save();

    return res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own administrator account" });
    }

    await user.deleteOne();

    return res.json({ message: "User removed" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
