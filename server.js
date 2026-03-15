import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import complaintRoutes from "./routes/complaintRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is not set. Running in in-memory fallback mode.");
} else {
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      console.log("✅ Connected to MongoDB Atlas");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      console.warn("⚠️ Continuing with in-memory fallback mode.");
    });
}

// Routes
app.use("/api", complaintRoutes);
app.use("/api", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

