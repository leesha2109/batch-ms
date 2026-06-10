import mongoose from 'mongoose'

const TimetableSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    required: true
  },
  startTime:  { type: String, required: true },  // e.g. "08:00"
  endTime:    { type: String, required: true },  // e.g. "10:00"
  subjectAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectAssignment'
  },
  location:   { type: String, default: '' },     // e.g. "Lab 01"
}, { _id: true })

const TimetableSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  semesterNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  slots: [TimetableSlotSchema]
}, { timestamps: true })

export default mongoose.models.Timetable ||
  mongoose.model('Timetable', TimetableSchema)
