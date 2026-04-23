const express = require("express");
const Task = require("../models/Task");
const { authMiddleware } = require("../middleware/auth");
const { pushTaskJob } = require("../services/queue");

const router = express.Router();

const allowedOps = ["uppercase", "lowercase", "reverse", "word_count"];

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const { title, inputText, operation } = req.body;

    if (!title || !inputText || !allowedOps.includes(operation)) {
      return res.status(400).json({ message: "Invalid task payload" });
    }

    const task = await Task.create({
      userId: req.user.id,
      title,
      inputText,
      operation,
      status: "pending",
      logs: [{ message: "Task created" }],
    });

    return res.status(201).json(task);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Task creation failed", error: error.message });
  }
});

router.post("/:id/run", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "running") {
      return res.status(409).json({ message: "Task is already running" });
    }

    task.status = "pending";
    task.logs.push({ message: "Task queued for processing" });
    await task.save();

    await pushTaskJob(task._id.toString());

    return res.json({
      message: "Task queued",
      taskId: task._id,
      status: task.status,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to queue task", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(tasks);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not fetch tasks", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(task);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not fetch task", error: error.message });
  }
});

module.exports = router;
