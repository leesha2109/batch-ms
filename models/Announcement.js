import mongoose from 'mongoose'

const AnnouncementSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  postedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null }, // null = all students
}, { timestamps: true })

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema)