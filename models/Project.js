import mongoose from 'mongoose'

const DocumentSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  url:        { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
})

const ProjectSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, default: '' },
  type:         { type: String, enum: ['individual', 'group'], required: true },
  batchId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  level:        { type: Number, default: null },
  semester:     { type: Number, default: null },
  subjectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null },
  students:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status:       {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'evaluated'],
    default: 'not_started'
  },
  startDate:    { type: Date, default: null },
  documents:    [DocumentSchema],
}, { timestamps: true })

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema)