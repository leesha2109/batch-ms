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
  },
  examHeld: {
    type: Boolean,
    default: false
  },
  resultsReleased: {
    type: Boolean,
    default: false
  },
  paperSetting: {
  status:          { type: String, enum: ['pending', 'submitted', 'approved'], default: 'pending' },
  moderatorName:   { type: String, default: '' },
  moderatorEmail:  { type: String, default: '' },
  moderateStatus:  { type: String, enum: ['pending', 'moderated'], default: 'pending' },
},
paperMarking: {
  firstMarkingStatus:  { type: String, enum: ['not_finished', 'finished'], default: 'not_finished' },
  secondMarkerName:    { type: String, default: '' },
  secondMarkerEmail:   { type: String, default: '' },
  secondMarkingStatus: { type: String, enum: ['not_finished', 'finished'], default: 'not_finished' },
},
}, { timestamps: true })

export default mongoose.models.SubjectAssignment ||
  mongoose.model('SubjectAssignment', SubjectAssignmentSchema)