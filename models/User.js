import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["hod", "coordinator", "lecturer", "visiting_lecturer", "student"],
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null, // only used for coordinators and students
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // only used for visiting lecturers
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    studentId:   { type: String, default: '' },  // e.g. "BSc/2022/001"
  phone:       { type: String, default: '' },
  address:     { type: String, default: '' },
  dateOfBirth: { type: Date,   default: null },
  enrolledAt:  { type: Date,   default: null },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
