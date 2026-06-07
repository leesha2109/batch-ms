import mongoose from 'mongoose'

const AccessRequestSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true },
  role:          { type: String, enum: ['student', 'lecturer'], required: true },
  studentNumber: { type: String },
  status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true })

export default mongoose.models.AccessRequest || mongoose.model('AccessRequest', AccessRequestSchema)