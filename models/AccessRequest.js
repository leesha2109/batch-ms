import mongoose from "mongoose";

const AccessRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, required: true, enum: ["student", "lecturer"] },
    studentNumber: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.AccessRequest ||
  mongoose.model("AccessRequest", AccessRequestSchema);
