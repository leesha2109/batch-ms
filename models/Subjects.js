import mongoose from 'mongoose'

const SubjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
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
    enum: ['BSc', 'BCS'],
    required: true
  },
  groupId: {
    type: String,
    default: null
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  semester: {
    type: Number,
    required: true,
    enum: [1, 2]
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