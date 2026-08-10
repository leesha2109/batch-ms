import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["individual", "group"], required: true },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    level: { type: Number, default: null },
    semester: { type: Number, default: null },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["not_started", "in_progress", "submitted", "evaluated"],
      default: "not_started",
    },
    startDate: { type: Date, default: null },
    documents: [DocumentSchema],
    milestones: {
      titleConfirmed: { type: Boolean, default: false },
      proposalSubmitted: { type: Boolean, default: false },
      interimSubmitted: { type: Boolean, default: false },
      finalSubmitted: { type: Boolean, default: false },
    },
    marks: {
      proposal: {
        max: { type: Number, default: 10 },
        rows: [
          {
            name: { type: String, default: "" },
            studentId: { type: String, default: "" },
            supervisor: { type: String, default: "" },
            mark: { type: Number, default: 0 },
            m1: { type: Number, default: 0 },
            m2: { type: Number, default: 0 },
            m3: { type: Number, default: 0 },
            m4: { type: Number, default: 0 },
            reportMarks: { type: Number, default: 0 },
          },
        ],
      },
      interim: {
        max: { type: Number, default: 10 },
        rows: [
          {
            name: { type: String, default: "" },
            studentId: { type: String, default: "" },
            supervisor: { type: String, default: "" },
            mark: { type: Number, default: 0 },
          },
        ],
      },
      finalReport: {
        max: { type: Number, default: 45 },
        rows: [
          {
            name: { type: String, default: "" },
            studentId: { type: String, default: "" },
            supervisor: { type: String, default: "" },
            mark: { type: Number, default: 0 },
            m1: { type: Number, default: 0 },
            m2: { type: Number, default: 0 },
          },
        ],
      },
      publication: {
        max: { type: Number, default: 15 },
        rows: [
          {
            name: { type: String, default: "" },
            studentId: { type: String, default: "" },
            supervisor: { type: String, default: "" },
            mark: { type: Number, default: 0 },
          },
        ],
      },
      finalViva: {
        max: { type: Number, default: 20 },
        rows: [
          {
            name: { type: String, default: "" },
            studentId: { type: String, default: "" },
            supervisor: { type: String, default: "" },
            mark: { type: Number, default: 0 },
            m1: { type: Number, default: 0 },
            m2: { type: Number, default: 0 },
            m3: { type: Number, default: 0 },
            m4: { type: Number, default: 0 },
          },
        ],
      },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);
