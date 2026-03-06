const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
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

router.post("/", protect, async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      shippingPrice,
      taxPrice,
      couponCode,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const normalizedShippingPrice = Number(shippingPrice) || 0;
    const normalizedTaxPrice = Number(taxPrice) || 0;

    const processedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product in order not found" });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      processedItems.push({
        product: product._id,
        name: product.name,
        qty: item.qty,
        price: product.price,
        image: product.image,
      });
    }

    const itemsPrice = processedItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    let normalizedCouponCode = "";
    let couponDiscount = 0;

    if (couponCode && typeof couponCode === "string") {
      normalizedCouponCode = couponCode.trim().toUpperCase();
    }

    let appliedCoupon = null;

    if (normalizedCouponCode) {
      const coupon = await Coupon.findOne({ code: normalizedCouponCode });

      if (coupon && coupon.isActive) {
        const now = new Date();

        if (
          (!coupon.startDate || coupon.startDate <= now) &&
          (!coupon.endDate || coupon.endDate >= now) &&
          !(
            coupon.usageLimit != null &&
            coupon.usageLimit >= 0 &&
            coupon.usedCount >= coupon.usageLimit
          ) &&
          !(
            coupon.minOrderAmount != null &&
            coupon.minOrderAmount > 0 &&
            itemsPrice < coupon.minOrderAmount
          )
        ) {
          const discountAmount = calculateDiscount(coupon, itemsPrice);

          if (discountAmount > 0) {
            couponDiscount = discountAmount;
            appliedCoupon = coupon;
          }
        }
      }
    }

    const totalPrice =
      itemsPrice - couponDiscount + normalizedShippingPrice + normalizedTaxPrice;

    const order = await Order.create({
      user: req.user._id,
      orderItems: processedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice: normalizedShippingPrice,
      taxPrice: normalizedTaxPrice,
      totalPrice,
      couponCode: couponDiscount > 0 ? normalizedCouponCode : undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : 0,
    });

    const updates = processedItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty },
      })
    );

    if (appliedCoupon) {
      updates.push(
        Coupon.findByIdAndUpdate(appliedCoupon._id, {
          $inc: { usedCount: 1 },
        })
      );
    }

    await Promise.all(updates);

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:id", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id })
      .sort("-createdAt")
      .select(
        "_id user totalPrice isPaid status createdAt paymentMethod itemsPrice shippingPrice taxPrice"
      );
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/summary", protect, admin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    const paidOrders = await Order.countDocuments({ isPaid: true });

    const totalSalesResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalSales =
      totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

    const customers = await Order.distinct("user");

    return res.json({
      totalOrders,
      paidOrders,
      unpaidOrders: totalOrders - paidOrders,
      totalSales,
      totalCustomers: customers.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/sales-by-date", protect, admin, async (req, res) => {
  try {
    const now = new Date();

    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : now;

    const sales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: from, $lte: to },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalSales: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    const daily = sales.map((item) => {
      const year = item._id.year;
      const month = String(item._id.month).padStart(2, "0");
      const day = String(item._id.day).padStart(2, "0");

      return {
        date: `${year}-${month}-${day}`,
        totalSales: item.totalSales,
        orders: item.orders,
      };
    });

    return res.json({
      from: from.toISOString(),
      to: to.toISOString(),
      daily,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/top-products", protect, admin, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const topProducts = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          name: { $first: "$orderItems.name" },
          image: { $first: "$orderItems.image" },
          totalQuantity: { $sum: "$orderItems.qty" },
          totalSales: {
            $sum: {
              $multiply: ["$orderItems.qty", "$orderItems.price"],
            },
          },
        },
      },
      {
        $sort: {
          totalQuantity: -1,
        },
      },
      {
        $limit: limit,
      },
    ]);

    return res.json(topProducts);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/customer-acquisition", protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const from = req.query.from ? new Date(req.query.from) : defaultFrom;
    const to = req.query.to ? new Date(req.query.to) : now;

    const activeUsers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: from, $lte: to },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: "$user",
        },
      },
    ]);

    if (activeUsers.length === 0) {
      return res.json({
        from: from.toISOString(),
        to: to.toISOString(),
        totalNewCustomers: 0,
        totalReturningCustomers: 0,
        newCustomersByDate: [],
      });
    }

    const userIds = activeUsers
      .map((item) => item._id)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    const firstOrders = await Order.aggregate([
      {
        $match: {
          user: { $in: userIds },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: "$user",
          firstOrderDate: { $min: "$createdAt" },
        },
      },
    ]);

    let totalNewCustomers = 0;
    let totalReturningCustomers = 0;
    const newCustomersByDateMap = new Map();

    for (const item of firstOrders) {
      const date = item.firstOrderDate;
      if (!date) {
        continue;
      }
      const time = date.getTime();
      const isNew = time >= from.getTime() && time <= to.getTime();

      if (isNew) {
        totalNewCustomers += 1;
        const key = date.toISOString().split("T")[0];
        const current = newCustomersByDateMap.get(key) || 0;
        newCustomersByDateMap.set(key, current + 1);
      } else {
        totalReturningCustomers += 1;
      }
    }

    const newCustomersByDate = Array.from(newCustomersByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    return res.json({
      from: from.toISOString(),
      to: to.toISOString(),
      totalNewCustomers,
      totalReturningCustomers,
      newCustomersByDate,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/revenue", protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const from = req.query.from ? new Date(req.query.from) : defaultFrom;
    const to = req.query.to ? new Date(req.query.to) : now;

    const matchStage = {
      createdAt: { $gte: from, $lte: to },
      isPaid: true,
    };

    const [summary] = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$totalPrice" },
        },
      },
    ]);

    const paymentMethodBreakdown = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    const statusBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return res.json({
      from: from.toISOString(),
      to: to.toISOString(),
      totalRevenue: summary ? summary.totalRevenue : 0,
      totalOrders: summary ? summary.totalOrders : 0,
      averageOrderValue: summary ? summary.averageOrderValue || 0 : 0,
      paymentMethodBreakdown: paymentMethodBreakdown.map((item) => ({
        paymentMethod: item._id || "Unknown",
        revenue: item.revenue,
        orders: item.orders,
      })),
      statusBreakdown: statusBreakdown.map((item) => ({
        status: item._id || "unknown",
        count: item.count,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/top-customers", protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const from = req.query.from ? new Date(req.query.from) : defaultFrom;
    const to = req.query.to ? new Date(req.query.to) : now;
    const limit = Number(req.query.limit) || 10;

    const revenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: from, $lte: to },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: "$user",
          totalRevenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalRevenue: -1,
        },
      },
      {
        $limit: limit,
      },
    ]);

    if (revenueAgg.length === 0) {
      return res.json({
        from: from.toISOString(),
        to: to.toISOString(),
        customers: [],
      });
    }

    const userIds = revenueAgg
      .map((item) => item._id)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    const users = await User.find({ _id: { $in: userIds } })
      .select("name email")
      .lean();

    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(String(user._id), user);
    });

    const customers = revenueAgg.map((item) => {
      const user = userMap.get(String(item._id));
      return {
        userId: item._id,
        name: user ? user.name : "Unknown",
        email: user ? user.email : "",
        totalRevenue: item.totalRevenue,
        orders: item.orders,
      };
    });

    return res.json({
      from: from.toISOString(),
      to: to.toISOString(),
      customers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/stats/abandoned-carts", protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const olderThanHours = Number(req.query.olderThanHours) || 24;
    const threshold = new Date(now.getTime() - olderThanHours * 60 * 60 * 1000);

    const abandonedOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $lte: threshold },
          isPaid: false,
          status: { $in: ["pending", "processing"] },
        },
      },
      {
        $group: {
          _id: null,
          totalAbandoned: { $sum: 1 },
          estimatedLostRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const byPaymentMethod = await Order.aggregate([
      {
        $match: {
          createdAt: { $lte: threshold },
          isPaid: false,
          status: { $in: ["pending", "processing"] },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          estimatedLostRevenue: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: {
          estimatedLostRevenue: -1,
        },
      },
    ]);

    const summary = abandonedOrders[0] || {
      totalAbandoned: 0,
      estimatedLostRevenue: 0,
    };

    return res.json({
      olderThanHours,
      totalAbandoned: summary.totalAbandoned || 0,
      estimatedLostRevenue: summary.estimatedLostRevenue || 0,
      byPaymentMethod: byPaymentMethod.map((item) => ({
        paymentMethod: item._id || "Unknown",
        count: item.count,
        estimatedLostRevenue: item.estimatedLostRevenue,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protect, admin, async (req, res) => {
  try {
    const filter = {};

    if (req.query.from || req.query.to) {
      const createdAt = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);
        if (!Number.isNaN(fromDate.getTime())) {
          createdAt.$gte = fromDate;
        }
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);
        if (!Number.isNaN(toDate.getTime())) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          createdAt.$lte = endOfDay;
        }
      }

      if (Object.keys(createdAt).length > 0) {
        filter.createdAt = createdAt;
      }
    }

    const page = Number(req.query.page) || 0;
    const pageSize = Number(req.query.pageSize) || 0;

    if (!page || !pageSize) {
      const orders = await Order.find(filter)
        .populate("user", "name email")
        .sort("-createdAt");
      return res.json(orders);
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort("-createdAt")
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      orders,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      !req.user.isAdmin &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/pay", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      !req.user.isAdmin &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    order.isPaid = true;
    order.paidAt = new Date();

    const updatedOrder = await order.save();

    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status || order.status;

    if (status === "delivered" && !order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/bulk/status", protect, admin, async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res
        .status(400)
        .json({ message: "orderIds must be a non-empty array" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No matching orders found" });
    }

    const bulkUpdates = orders.map((order) => {
      order.status = status || order.status;

      if (status === "delivered" && !order.isDelivered) {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }

      return order.save();
    });

    const updatedOrders = await Promise.all(bulkUpdates);

    return res.json({
      updatedCount: updatedOrders.length,
      orders: updatedOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      !req.user.isAdmin &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order already cancelled" });
    }

    if (order.status === "shipped" || order.status === "delivered") {
      return res
        .status(400)
        .json({ message: "Cannot cancel an order that has been shipped or delivered" });
    }

    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.qty },
        })
      )
    );

    order.status = "cancelled";
    const updatedOrder = await order.save();

    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

