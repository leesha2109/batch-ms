import mongoose from "mongoose";

const ExamCommentSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    semester: { type: Number, required: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true }, // denormalized for fast render
    message: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL index — MongoDB automatically deletes documents 24 hours (86400s)
// after their createdAt value. No cron job or cleanup script needed.
ExamCommentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.ExamComment ||
  mongoose.model("ExamComment", ExamCommentSchema);