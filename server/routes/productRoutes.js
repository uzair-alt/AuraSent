const express = require("express");
const Product = require("../models/Product");
const { uploadImage } = require("../utils/cloudinary");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

async function processProductImage(image) {
  if (!image) {
    return null;
  }

  if (typeof image === "string" && image.startsWith("http")) {
    return image;
  }

  const uploaded = await uploadImage(image);
  return uploaded;
}

async function processProductImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  const results = [];

  for (const item of images) {
    // Reuse single-image helper to support both URLs and base64 payloads
    const url = await processProductImage(item);
    if (url) {
      results.push(url);
    }
  }

  return results;
}

router.get("/stats/low-stock", protect, admin, async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 5;
    const products = await Product.find({
      stock: { $lte: threshold },
      $or: [{ archived: { $exists: false } }, { archived: false }],
    })
      .sort("stock")
      .select("name brand stock price image category");

    return res.json({
      threshold,
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/inventory-summary", protect, admin, async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 5;

    const baseFilter = {
      $or: [{ archived: { $exists: false } }, { archived: false }],
    };

    const [totalProducts, lowStockCount, outOfStockCount] = await Promise.all([
      Product.countDocuments(baseFilter),
      Product.countDocuments({
        ...baseFilter,
        stock: { $lte: threshold, $gt: 0 },
      }),
      Product.countDocuments({
        ...baseFilter,
        stock: { $lte: 0 },
      }),
    ]);

    return res.json({
      threshold,
      totalProducts,
      lowStockCount,
      outOfStockCount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/category-distribution", protect, admin, async (req, res) => {
  try {
    const baseFilter = {
      $or: [{ archived: { $exists: false } }, { archived: false }],
    };

    const categories = await Product.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const mapped = categories
      .filter((item) => item && item._id)
      .map((item) => ({
        name: item._id,
        count: item.count,
      }));

    return res.json({
      categories: mapped,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 12;
    const keyword = req.query.keyword ? req.query.keyword.trim() : "";
    const sortBy = req.query.sortBy ? req.query.sortBy.trim() : "newest";
    const brand = req.query.brand ? req.query.brand.trim() : "";
    const category = req.query.category ? req.query.category.trim() : "";
    const gender = req.query.gender ? req.query.gender.trim() : "";
    const collectionType = req.query.collectionType
      ? req.query.collectionType.trim()
      : "";
    const rawOccasion = req.query.occasion
      ? String(req.query.occasion)
      : "";
    const rawMood = req.query.mood ? String(req.query.mood) : "";
    const categoryId = req.query.categoryId ? req.query.categoryId.trim() : "";
    const isFeatured = req.query.isFeatured;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : 0;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : 0;
    const rawNotes = req.query.notes ? String(req.query.notes) : "";

    const notes =
      rawNotes
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [];

    const occasions =
      rawOccasion
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [];

    const moods =
      rawMood
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [];

    const filter = {
      $or: [{ archived: { $exists: false } }, { archived: false }],
    };

    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }

    if (brand) {
      filter.brand = brand;
    }

    if (category) {
      filter.category = category;
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (gender) {
      filter.gender = gender;
    }

    if (collectionType) {
      filter.collectionType = collectionType;
    }

    if (isFeatured === "true") {
      filter.isFeatured = true;
    }

    if (minPrice > 0 || maxPrice > 0) {
      filter.price = {};

      if (minPrice > 0) {
        filter.price.$gte = minPrice;
      }

      if (maxPrice > 0) {
        filter.price.$lte = maxPrice;
      }
    }

    let query = { ...filter };

    if (notes.length > 0) {
      const notesFilter = {
        $or: [
          { "notes.top": { $in: notes } },
          { "notes.middle": { $in: notes } },
          { "notes.base": { $in: notes } },
        ],
      };

      query = {
        ...query,
        $and: [...(query.$and || []), notesFilter],
      };
    }

    if (occasions.length > 0) {
      const occasionFilter = {
        occasion: { $in: occasions },
      };

      query = {
        ...query,
        $and: [...(query.$and || []), occasionFilter],
      };
    }

    if (moods.length > 0) {
      const moodFilter = {
        mood: { $in: moods },
      };

      query = {
        ...query,
        $and: [...(query.$and || []), moodFilter],
      };
    }

    let sortOption = "-createdAt";

    if (sortBy === "priceAsc") {
      sortOption = "price";
    } else if (sortBy === "priceDesc") {
      sortOption = "-price";
    } else if (sortBy === "rating") {
      sortOption = "-rating";
    }

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      products,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/archived/list", protect, admin, async (req, res) => {
  try {
    const products = await Product.find({ archived: true }).sort("-updatedAt");
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const visibleReviews = (product.reviews || []).filter(
      (review) => !review.isHidden
    );

    return res.json(visibleReviews);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/reviews/admin", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product.reviews || []);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch(
  "/:id/reviews/:reviewId/hide",
  protect,
  admin,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const review = product.reviews.id(req.params.reviewId);

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      review.isHidden = Boolean(req.body.isHidden);

      await product.save();

      return res.json(review);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/:id/reviews/:reviewId", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.deleteOne();

    await product.save();

    return res.json({ message: "Review removed" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, admin, async (req, res) => {
  try {
    const primaryImage = await processProductImage(req.body.image);
    const extraImages = await processProductImages(req.body.images);

    if (!primaryImage && extraImages.length === 0) {
      return res.status(400).json({ message: "Product image is required" });
    }

    const allImages = [];

    if (primaryImage) {
      allImages.push(primaryImage);
    }

    for (const url of extraImages) {
      if (!allImages.includes(url)) {
        allImages.push(url);
      }
    }

    const payload = {
      ...req.body,
    };

    if (primaryImage) {
      payload.image = primaryImage;
    }

    payload.images = allImages;

    const product = await Product.create(payload);

    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: "Invalid product data" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.body.name !== undefined) {
      product.name = req.body.name;
    }

    if (req.body.brand !== undefined) {
      product.brand = req.body.brand;
    }

    if (req.body.description !== undefined) {
      product.description = req.body.description;
    }

    if (req.body.price !== undefined) {
      product.price = req.body.price;
    }

    if (req.body.stock !== undefined) {
      product.stock = req.body.stock;
    }

    if (req.body.category !== undefined) {
      product.category = req.body.category;
    }

    if (req.body.categoryId !== undefined) {
      product.categoryId = req.body.categoryId || null;
    }

    if (req.body.gender !== undefined) {
      product.gender = req.body.gender;
    }

    if (req.body.occasion !== undefined) {
      product.occasion = Array.isArray(req.body.occasion)
        ? req.body.occasion
        : [];
    }

    if (req.body.mood !== undefined) {
      product.mood = Array.isArray(req.body.mood) ? req.body.mood : [];
    }

    if (req.body.collectionType !== undefined) {
      product.collectionType = req.body.collectionType;
    }

    if (req.body.isFeatured !== undefined) {
      product.isFeatured = req.body.isFeatured;
    }

    if (req.body.notes !== undefined) {
      product.notes = req.body.notes;
    }

    if (req.body.image !== undefined || req.body.images !== undefined) {
      const primaryImage = await processProductImage(req.body.image);
      const extraImages = await processProductImages(req.body.images);

      if (!primaryImage && extraImages.length === 0) {
        return res.status(400).json({ message: "Product image is required" });
      }

      const allImages = [];

      if (primaryImage) {
        allImages.push(primaryImage);
      } else if (product.image) {
        allImages.push(product.image);
      }

      for (const url of extraImages) {
        if (!allImages.includes(url)) {
          allImages.push(url);
        }
      }

      product.image = allImages[0];
      product.images = allImages;
    }

    const updatedProduct = await product.save();

    return res.json(updatedProduct);
  } catch (error) {
    return res.status(400).json({ message: "Invalid product data" });
  }
});

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.archived) {
      return res.status(400).json({ message: "Product already archived" });
    }

    product.archived = true;
    await product.save();

    return res.json({ message: "Product archived" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/restore", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.archived) {
      return res
        .status(400)
        .json({ message: "Product is not archived and cannot be restored" });
    }

    product.archived = false;
    const restoredProduct = await product.save();

    return res.json(restoredProduct);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/featured/list", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const products = await Product.find({
      isFeatured: true,
      $or: [{ archived: { $exists: false } }, { archived: false }],
    })
      .sort("-createdAt")
      .limit(limit);

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/reviews", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed" });
    }

    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5" });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const newReview = {
      user: req.user._id,
      name: req.user.name,
      rating: numericRating,
      comment: comment.trim(),
    };

    product.reviews.push(newReview);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    await product.save();

    return res.status(201).json(newReview);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:productId/reviews/:reviewId", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Not authorized to edit review" });
    }

    const numericRating = rating ? Number(rating) : null;

    if (numericRating && (numericRating < 1 || numericRating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5" });
    }

    if (numericRating) {
      review.rating = numericRating;
    }

    if (comment && comment.trim()) {
      review.comment = comment.trim();
    }

    product.rating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length;

    await product.save();

    return res.json(review);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:productId/reviews/:reviewId", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete review" });
    }

    review.deleteOne();

    product.numReviews = product.reviews.length;

    if (product.reviews.length > 0) {
      product.rating =
        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length;
    } else {
      product.rating = 0;
    }

    await product.save();

    return res.json({ message: "Review removed" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
