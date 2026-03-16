import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import complaintRoutes from "./routes/complaintRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const DB_CONNECT_BASE_DELAY_MS = 2000;
const DB_CONNECT_MAX_DELAY_MS = 30000;

let reconnectTimer = null;
let reconnectAttempts = 0;
let isConnecting = false;
let connectionPromise = null;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const scheduleReconnect = () => {
  if (reconnectTimer || !MONGODB_URI || mongoose.connection.readyState === 1) {
    return;
  }

  const nextDelay = Math.min(
    DB_CONNECT_BASE_DELAY_MS * (2 ** reconnectAttempts),
    DB_CONNECT_MAX_DELAY_MS
  );

  reconnectAttempts += 1;
  console.warn(`⚠️ MongoDB disconnected. Retrying in ${nextDelay / 1000}s (attempt ${reconnectAttempts})...`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await connectMongo();
  }, nextDelay);
};

const connectMongo = async () => {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set. Complaint APIs will return 503 until MongoDB is configured.");
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 20,
    });
    reconnectAttempts = 0;
    console.log("✅ Connected to MongoDB Atlas");
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    scheduleReconnect();
    return false;
  } finally {
    isConnecting = false;
    connectionPromise = null;
  }
  })();

  return connectionPromise;
};

const ensureMongoConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const connected = await connectMongo();
  return connected && mongoose.connection.readyState === 1;
};

mongoose.connection.on("disconnected", () => {
  scheduleReconnect();
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err.message);
});

mongoose.connection.on("connected", () => {
  reconnectAttempts = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
});

connectMongo();

app.use("/api", async (req, res, next) => {
  const connected = await ensureMongoConnection();
  if (!connected) {
    return res.status(503).json({
      message: "Database unavailable. Please try again once MongoDB reconnects.",
    });
  }

  return next();
});

// Routes
app.use("/api", complaintRoutes);
app.use("/api", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  await mongoose.connection.close();
  process.exit(0);
});

