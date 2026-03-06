const express = require("express");
const Category = require("../models/Category");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protect, admin, async (req, res) => {
  try {
    const isActive = req.query.active ? req.query.active.trim() : "";
    const parent = req.query.parent ? req.query.parent.trim() : "";

    const filter = {};

    if (isActive === "true") {
      filter.isActive = true;
    } else if (isActive === "false") {
      filter.isActive = false;
    }

    if (parent === "root") {
      filter.parent = null;
    } else if (parent) {
      filter.parent = parent;
    }

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      parent,
      image,
      icon,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription,
      filters,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const baseSlug =
      slug && slug.trim()
        ? slug.trim().toLowerCase()
        : name.trim().toLowerCase().replace(/\s+/g, "-");

    const existing = await Category.findOne({ slug: baseSlug });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Category slug already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: baseSlug,
      description: description ? description.trim() : "",
      parent: parent || null,
      image: image ? String(image).trim() : "",
      icon: icon ? String(icon).trim() : "",
      isActive: typeof isActive === "boolean" ? isActive : true,
      sortOrder:
        typeof sortOrder === "number" ? sortOrder : 0,
      metaTitle: metaTitle ? metaTitle.trim() : "",
      metaDescription: metaDescription ? metaDescription.trim() : "",
      filters: filters && typeof filters === "object" ? filters : {},
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const {
      name,
      slug,
      description,
      parent,
      image,
      icon,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription,
      filters,
    } = req.body;

    if (name != null) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      category.name = name.trim();
    }

    if (slug != null) {
      const normalizedSlug = slug.trim().toLowerCase();
      const exists = await Category.findOne({
        slug: normalizedSlug,
        _id: { $ne: category._id },
      });

      if (exists) {
        return res
          .status(409)
          .json({ message: "Category slug already exists" });
      }

      category.slug = normalizedSlug;
    }

    if (description != null) {
      category.description = description.trim();
    }

    if (parent !== undefined) {
      category.parent = parent || null;
    }

    if (image != null) {
      category.image = String(image).trim();
    }

    if (icon != null) {
      category.icon = String(icon).trim();
    }

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    if (typeof sortOrder === "number") {
      category.sortOrder = sortOrder;
    }

    if (metaTitle != null) {
      category.metaTitle = metaTitle.trim();
    }

    if (metaDescription != null) {
      category.metaDescription = metaDescription.trim();
    }

    if (filters && typeof filters === "object") {
      category.filters = filters;
    }

    const updated = await category.save();

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();

    return res.json({ message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

