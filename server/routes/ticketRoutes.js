const express = require("express");
const Ticket = require("../models/Ticket");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { subject, message, type, orderId } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "Subject is required" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    let linkedOrder = null;

    if (orderId) {
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (
        !req.user.isAdmin &&
        order.user.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to link this order" });
      }

      linkedOrder = order._id;
    }

    const ticket = await Ticket.create({
      user: req.user._id,
      order: linkedOrder,
      subject: subject.trim(),
      type: type || "general",
      messages: [
        {
          senderType: "user",
          message: message.trim(),
        },
      ],
    });

    const populated = await ticket.populate("order", "totalPrice status");

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate("order", "totalPrice status createdAt")
      .sort("-createdAt");

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protect, admin, async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const tickets = await Ticket.find(filter)
      .populate("user", "name email")
      .populate("order", "totalPrice status createdAt")
      .sort("-createdAt");

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("user", "name email")
      .populate("order", "totalPrice status createdAt");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (
      !req.user.isAdmin &&
      ticket.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this ticket" });
    }

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/messages", protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (
      !req.user.isAdmin &&
      ticket.user.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this ticket" });
    }

    ticket.messages.push({
      senderType: req.user.isAdmin ? "admin" : "user",
      message: message.trim(),
    });

    ticket.updatedAt = new Date();

    const updated = await ticket.save();

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (status) {
      ticket.status = status;
    }

    const updated = await ticket.save();

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

