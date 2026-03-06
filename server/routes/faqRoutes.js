const express = require("express");
const Faq = require("../models/Faq");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const faqs = await Faq.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.json(faqs);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin", protect, admin, async (req, res) => {
  try {
    const faqs = await Faq.find({})
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.json(faqs);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, admin, async (req, res) => {
  try {
    const { question, answer, category, order, isActive } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const faq = await Faq.create({
      question: question.trim(),
      answer: answer.trim(),
      category: category ? String(category).trim() : "",
      order: typeof order === "number" ? order : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return res.status(201).json(faq);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { question, answer, category, order, isActive } = req.body;

    const faq = await Faq.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    if (question != null) {
      faq.question = question.trim();
    }

    if (answer != null) {
      faq.answer = answer.trim();
    }

    if (category != null) {
      faq.category = String(category).trim();
    }

    if (typeof order === "number") {
      faq.order = order;
    }

    if (typeof isActive === "boolean") {
      faq.isActive = isActive;
    }

    const updated = await faq.save();

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    await faq.deleteOne();

    return res.json({ message: "FAQ deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

