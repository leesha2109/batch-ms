// This file's only job is to make sure every Mongoose model is registered
// exactly once, no matter which API route runs first. Without this, nested
// populate() calls (e.g. LectureLog -> subjectAssignmentId -> subjectId)
// can throw "MissingSchemaError" in dev mode if the route that happens to
// run first never directly imported one of the referenced models.
//
// Import this file at the top of any route that uses populate() across
// more than one model relationship.

import User from '@/models/User'
import Batch from '@/models/Batch'
import Subject from '@/models/Subjects'
import SubjectAssignment from '@/models/SubjectAssignment'
import Timetable from '@/models/Timetable'
import LectureLog from '@/models/LectureLog'

export {
  User,
  Batch,
  Subject,
  SubjectAssignment,
  Timetable,
  LectureLog,
}