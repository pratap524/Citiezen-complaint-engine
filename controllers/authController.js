import User from "../models/User.js";
import { randomUUID } from "node:crypto";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inMemoryUsers = [];

const isDbConnected = () => User.db?.readyState === 1;

const normalizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  organization: user.organization,
  accountType: user.accountType,
  governmentAuthorityId: user.governmentAuthorityId || "",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const signup = async (req, res) => {
  const {
    fullName,
    email,
    organization,
    accountType = "citizen",
    governmentAuthorityId = "",
    password,
    confirmPassword,
  } = req.body;

  if (!fullName || fullName.trim().length < 2) {
    return res.status(400).json({ message: "Please enter your full name." });
  }

  if (!email || !emailPattern.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  if (!organization) {
    return res.status(400).json({ message: "Please select your organization or department." });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Password and confirm password do not match." });
  }

  if (accountType === "government" && !governmentAuthorityId.trim()) {
    return res.status(400).json({ message: "Government Authority ID is required for government accounts." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (!isDbConnected()) {
      const existing = inMemoryUsers.find((user) => user.email === normalizedEmail);
      if (existing) {
        return res.status(409).json({ message: "Account already exists for this email. Please login." });
      }

      const now = new Date();
      const created = {
        _id: randomUUID(),
        fullName: fullName.trim(),
        email: normalizedEmail,
        organization,
        accountType,
        governmentAuthorityId: accountType === "government" ? governmentAuthorityId.trim() : "",
        password,
        createdAt: now,
        updatedAt: now,
      };

      inMemoryUsers.push(created);

      return res.status(201).json({
        message: "Account created successfully.",
        user: normalizeUser(created),
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Account already exists for this email. Please login." });
    }

    const created = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      organization,
      accountType,
      governmentAuthorityId: accountType === "government" ? governmentAuthorityId.trim() : "",
      password,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: normalizeUser(created),
    });
  } catch (err) {
    console.error("❌ Error during signup:", err);
    return res.status(500).json({ message: "Unable to create account right now. Please try again." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please enter both email address and password." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (!isDbConnected()) {
      const user = inMemoryUsers.find((entry) => entry.email === normalizedEmail);

      if (!user) {
        return res.status(404).json({ message: "No account found. Please sign up first." });
      }

      if (user.password !== password) {
        return res.status(401).json({ message: "Incorrect password. Please try again." });
      }

      return res.json({
        message: "Login successful.",
        user: normalizeUser(user),
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found. Please sign up first." });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    return res.json({
      message: "Login successful.",
      user: normalizeUser(user),
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    return res.status(500).json({ message: "Unable to login right now. Please try again." });
  }
};
