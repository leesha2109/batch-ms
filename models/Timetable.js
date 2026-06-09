import mongoose from 'mongoose'

const TimetableSchema = new mongoose.Schema({
  batchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
  subject:   { type: String, required: true },
  lecturer:  { type: String, required: true },
  startTime: { type: String, required: true }, // e.g. "08:00"
  endTime:   { type: String, required: true }, // e.g. "10:00"
  room:      { type: String, default: '' },
}, { timestamps: true })

export default mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema)