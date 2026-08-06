import mongoose from "mongoose";

const ExamTimetableSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    semester: { type: Number, required: true },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    examDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "11:00"
    venue: { type: String, trim: true },
    examType: {
      type: String,
      enum: ["theory", "practical"],
      default: "theory",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// In dev/hot-reload environments the model may already be registered with an
// old schema. Delete it so the new schema (enum values) takes effect immediately.
if (mongoose.models && mongoose.models.ExamTimetable) {
  delete mongoose.models.ExamTimetable;
}

export default mongoose.models.ExamTimetable ||
  mongoose.model("ExamTimetable", ExamTimetableSchema);
