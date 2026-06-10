import mongoose from 'mongoose'

const SubjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true   // e.g. "CS101"
  },
  name: {
    type: String,
    required: true    // e.g. "Data Structures"
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ['theory', 'practical', 'project'],
    default: 'theory'
  },
  programme: {
    type: String,
    enum: ['BSc', 'BCS', 'Both'],
    default: 'Both'
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema)