import mongoose from 'mongoose'

const SubjectAssignmentSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
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
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',    // lecturer or visiting_lecturer
    default: null
  },
  year: {
    type: Number,
    required: true  // e.g. 2024
  }
}, { timestamps: true })

export default mongoose.models.SubjectAssignment ||
  mongoose.model('SubjectAssignment', SubjectAssignmentSchema)