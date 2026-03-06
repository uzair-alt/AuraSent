const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const featuredCollectionRoutes = require("./routes/featuredCollectionRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const faqRoutes = require("./routes/faqRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { requestLogger } = require("./middleware/loggerMiddleware");
const { NODE_ENV, PORT, MONGO_URI } = require("./config");

const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Fragrance API is running",
    env: NODE_ENV,
  });
});

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  const status =
    dbState === 1
      ? "healthy"
      : dbState === 2
      ? "connecting"
      : dbState === 0
      ? "disconnected"
      : "unknown";

  res.json({
    status,
    uptime: process.uptime(),
    db: {
      status,
      readyState: dbState,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/featured-collections", featuredCollectionRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/faqs", faqRoutes);

app.use(notFound);
app.use(errorHandler);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
