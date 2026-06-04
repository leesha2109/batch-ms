import mongoose from 'mongoose'

const SemesterSchema = new mongoose.Schema({
  semesterNumber: { type: Number, required: true },
  startDate:      { type: Date },
  endDate:        { type: Date },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed'],
    default: 'planned'
  },
  subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
}, { _id: true })

const BatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true   // e.g. "BSc 2022", "BCS 2023"
  },
  programme: {
    type: String,
    enum: ['BSc', 'BCS'],
    required: true
  },
  intakeYear: {
    type: Number,
    required: true
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  totalCreditsRequired: {
    type: Number,
    default: 120
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'upcoming'],
    default: 'active'
  },
  graduationTarget: {
    type: String   // e.g. "June 2026"
  },
  semesters: [SemesterSchema]
}, { timestamps: true })

export default mongoose.models.Batch || mongoose.model('Batch', BatchSchema)