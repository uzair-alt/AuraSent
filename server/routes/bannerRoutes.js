const express = require("express");
const Banner = require("../models/Banner");
const { uploadImage } = require("../utils/cloudinary");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", async (req, res) => {
  try {
    const placement = req.query.placement ? req.query.placement.trim() : "";

    const filter = { isActive: true };

    if (placement) {
      filter.placement = placement;
    }

    const banners = await Banner.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();

    return res.json(banners);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protect, admin, async (req, res) => {
  try {
    const placement = req.query.placement ? req.query.placement.trim() : "";
    const isActive = req.query.active ? req.query.active.trim() : "";

    const filter = {};

    if (placement) {
      filter.placement = placement;
    }

    if (isActive === "true") {
      filter.isActive = true;
    } else if (isActive === "false") {
      filter.isActive = false;
    }

    const banners = await Banner.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();

    return res.json(banners);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/upload-image", protect, admin, async (req, res) => {
  try {
    const image = req.body.image;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const uploadedUrl = await uploadImage(image);

    return res.status(201).json({ imageUrl: uploadedUrl });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload image" });
  }
});

router.post("/", protect, admin, async (req, res) => {
  try {
    const banner = await Banner.create(req.body);

    return res.status(201).json(banner);
  } catch (error) {
    return res.status(400).json({ message: "Invalid banner data" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (req.body.title !== undefined) {
      banner.title = req.body.title;
    }

    if (req.body.subtitle !== undefined) {
      banner.subtitle = req.body.subtitle;
    }

    if (req.body.imageUrl !== undefined) {
      banner.imageUrl = req.body.imageUrl;
    }

    if (req.body.linkUrl !== undefined) {
      banner.linkUrl = req.body.linkUrl;
    }

    if (req.body.placement !== undefined) {
      banner.placement = req.body.placement;
    }

    if (req.body.sortOrder !== undefined) {
      banner.sortOrder = req.body.sortOrder;
    }

    if (req.body.isActive !== undefined) {
      banner.isActive = req.body.isActive;
    }

    const updatedBanner = await banner.save();

    return res.json(updatedBanner);
  } catch (error) {
    return res.status(400).json({ message: "Invalid banner data" });
  }
});

router.patch("/:id/active", protect, admin, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const nextIsActive =
      typeof req.body.isActive === "boolean"
        ? req.body.isActive
        : !banner.isActive;

    banner.isActive = nextIsActive;

    const updatedBanner = await banner.save();

    return res.json(updatedBanner);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
