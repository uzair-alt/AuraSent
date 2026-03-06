const express = require("express");
const FeaturedCollection = require("../models/FeaturedCollection");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", async (req, res) => {
  try {
    const collections = await FeaturedCollection.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate("products", "name brand price image category")
      .exec();

    return res.json(collections);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protect, admin, async (req, res) => {
  try {
    const isActive = req.query.active ? req.query.active.trim() : "";

    const filter = {};

    if (isActive === "true") {
      filter.isActive = true;
    } else if (isActive === "false") {
      filter.isActive = false;
    }

    const collections = await FeaturedCollection.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate("products", "name brand price image category")
      .exec();

    return res.json(collections);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, admin, async (req, res) => {
  try {
    const payload = {
      ...req.body,
    };

    if (payload.slug) {
      payload.slug = payload.slug.trim().toLowerCase();
    }

    const existing = await FeaturedCollection.findOne({ slug: payload.slug });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Featured collection slug already exists" });
    }

    const collection = await FeaturedCollection.create(payload);

    const populated = await collection.populate(
      "products",
      "name brand price image category"
    );

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ message: "Invalid featured collection data" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const collection = await FeaturedCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Featured collection not found" });
    }

    if (req.body.slug !== undefined) {
      collection.slug = req.body.slug.trim().toLowerCase();
    }

    if (req.body.title !== undefined) {
      collection.title = req.body.title;
    }

    if (req.body.description !== undefined) {
      collection.description = req.body.description;
    }

    if (req.body.products !== undefined) {
      collection.products = req.body.products;
    }

    if (req.body.sortOrder !== undefined) {
      collection.sortOrder = req.body.sortOrder;
    }

    if (req.body.isActive !== undefined) {
      collection.isActive = req.body.isActive;
    }

    const updatedCollection = await collection.save();

    const populated = await updatedCollection.populate(
      "products",
      "name brand price image category"
    );

    return res.json(populated);
  } catch (error) {
    return res.status(400).json({ message: "Invalid featured collection data" });
  }
});

router.patch("/:id/active", protect, admin, async (req, res) => {
  try {
    const collection = await FeaturedCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Featured collection not found" });
    }

    const nextIsActive =
      typeof req.body.isActive === "boolean"
        ? req.body.isActive
        : !collection.isActive;

    collection.isActive = nextIsActive;

    const updatedCollection = await collection.save();

    const populated = await updatedCollection.populate(
      "products",
      "name brand price image category"
    );

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
