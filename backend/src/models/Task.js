const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    inputText: { type: String, required: true },
    operation: {
      type: String,
      required: true,
      enum: ["uppercase", "lowercase", "reverse", "word_count"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "running", "success", "failed"],
      default: "pending",
      index: true,
    },
    result: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    logs: { type: [logSchema], default: [] },
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
