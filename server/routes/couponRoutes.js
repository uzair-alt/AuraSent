const express = require("express");
const Coupon = require("../models/Coupon");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

const calculateDiscount = (coupon, itemsPrice) => {
  if (!coupon || !coupon.isActive) {
    return 0;
  }

  const amount = Math.max(0, Number(itemsPrice) || 0);

  if (amount <= 0) {
    return 0;
  }

  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = (amount * coupon.discountValue) / 100;
  } else if (coupon.discountType === "fixed") {
    discount = coupon.discountValue;
  }

  if (coupon.maxDiscountAmount != null && coupon.maxDiscountAmount >= 0) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  if (discount < 0) {
    discount = 0;
  }

  if (discount > amount) {
    discount = amount;
  }

  return discount;
};

router.get("/", protect, admin, async (req, res) => {
  try {
    const search = req.query.q ? req.query.q.trim() : "";
    const isActive = req.query.active ? req.query.active.trim() : "";
    const page = Number(req.query.page) || 0;
    const pageSize = Number(req.query.pageSize) || 0;

    const filter = {};

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive === "true") {
      filter.isActive = true;
    } else if (isActive === "false") {
      filter.isActive = false;
    }

    if (!page || !pageSize) {
      const coupons = await Coupon.find(filter).sort("-createdAt");
      return res.json(coupons);
    }

    const total = await Coupon.countDocuments(filter);

    const coupons = await Coupon.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      coupons,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, admin, async (req, res) => {
  try {
    const payload = {
      ...req.body,
    };

    if (payload.code) {
      payload.code = payload.code.trim().toUpperCase();
    }

    const existing = await Coupon.findOne({ code: payload.code });

    if (existing) {
      return res.status(409).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create(payload);

    return res.status(201).json(coupon);
  } catch (error) {
    return res.status(400).json({ message: "Invalid coupon data" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (req.body.code !== undefined) {
      coupon.code = req.body.code.trim().toUpperCase();
    }

    if (req.body.description !== undefined) {
      coupon.description = req.body.description;
    }

    if (req.body.discountType !== undefined) {
      coupon.discountType = req.body.discountType;
    }

    if (req.body.discountValue !== undefined) {
      coupon.discountValue = req.body.discountValue;
    }

    if (req.body.minOrderAmount !== undefined) {
      coupon.minOrderAmount = req.body.minOrderAmount;
    }

    if (req.body.maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount = req.body.maxDiscountAmount;
    }

    if (req.body.startDate !== undefined) {
      coupon.startDate = req.body.startDate;
    }

    if (req.body.endDate !== undefined) {
      coupon.endDate = req.body.endDate;
    }

    if (req.body.usageLimit !== undefined) {
      coupon.usageLimit = req.body.usageLimit;
    }

    if (req.body.isActive !== undefined) {
      coupon.isActive = req.body.isActive;
    }

    const updatedCoupon = await coupon.save();

    return res.json(updatedCoupon);
  } catch (error) {
    return res.status(400).json({ message: "Invalid coupon data" });
  }
});

router.patch("/:id/active", protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const nextIsActive =
      typeof req.body.isActive === "boolean"
        ? req.body.isActive
        : !coupon.isActive;

    coupon.isActive = nextIsActive;

    const updatedCoupon = await coupon.save();

    return res.json(updatedCoupon);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/apply", protect, async (req, res) => {
  try {
    const code = req.body.code ? String(req.body.code).trim().toUpperCase() : "";
    const itemsPrice = Number(req.body.itemsPrice) || 0;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    if (itemsPrice <= 0) {
      return res.status(400).json({
        message: "Cart total must be greater than 0 to apply a coupon",
      });
    }

    const coupon = await Coupon.findOne({ code });

    if (!coupon || !coupon.isActive) {
      return res.status(200).json({
        valid: false,
        code,
        message: "This coupon is not active.",
      });
    }

    const now = new Date();

    if (coupon.startDate && coupon.startDate > now) {
      return res.status(200).json({
        valid: false,
        code,
        message: "This coupon is not yet valid.",
      });
    }

    if (coupon.endDate && coupon.endDate < now) {
      return res.status(200).json({
        valid: false,
        code,
        message: "This coupon has expired.",
      });
    }

    if (
      coupon.usageLimit != null &&
      coupon.usageLimit >= 0 &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(200).json({
        valid: false,
        code,
        message: "This coupon has reached its usage limit.",
      });
    }

    if (
      coupon.minOrderAmount != null &&
      coupon.minOrderAmount > 0 &&
      itemsPrice < coupon.minOrderAmount
    ) {
      return res.status(200).json({
        valid: false,
        code,
        message: `Minimum order amount of ${coupon.minOrderAmount} is required for this coupon.`,
      });
    }

    const discountAmount = calculateDiscount(coupon, itemsPrice);

    if (discountAmount <= 0) {
      return res.status(200).json({
        valid: false,
        code,
        message: "This coupon does not provide a discount for this cart.",
      });
    }

    const finalItemsPrice = Math.max(0, itemsPrice - discountAmount);

    return res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      discountAmount,
      finalItemsPrice,
      message: "Coupon applied successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
