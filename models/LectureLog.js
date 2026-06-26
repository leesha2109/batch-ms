import mongoose from 'mongoose'

const LectureLogSchema = new mongoose.Schema({
  // what was taught
  subjectAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectAssignment',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  semesterNumber: {
    type: Number,
    required: true
  },

  // when it happened
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,   // "08:00"
    required: true
  },
  endTime: {
    type: String,   // "10:00"
    required: true
  },
  durationHours: {
    type: Number,   // computed at save time from start/end
    required: true
  },

  // who actually delivered the class
  taughtBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // who entered this record — may differ from taughtBy
  // (e.g. a student or coordinator logging on someone's behalf)
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  notes: {
    type: String,
    default: ''
  },
}, { timestamps: true })

// quick lookups for summary pages
LectureLogSchema.index({ batchId: 1, semesterNumber: 1 })
LectureLogSchema.index({ taughtBy: 1 })
LectureLogSchema.index({ subjectAssignmentId: 1 })
LectureLogSchema.index({ date: 1 })

export default mongoose.models.LectureLog ||
  mongoose.model('LectureLog', LectureLogSchema)