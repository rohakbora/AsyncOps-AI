const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res
        .status(400)
        .json({
          message: "Invalid input. Password must be at least 6 characters.",
        });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    return res
      .status(201)
      .json({ id: user._id, email: user.email, name: user.name });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      env.jwtSecret,
      { expiresIn: "1d" },
    );

    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
});

module.exports = router;
