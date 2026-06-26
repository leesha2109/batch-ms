import '@/lib/modelsRegistry'
import connectDB from '@/lib/mongoose'
import LectureLog from '@/models/LectureLog'
import User from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'

// GET — full teaching record for one lecturer: every logged session,
// grouped by subject+batch+semester, with totals. Used for the lecturer
// report view and the printable certification document.
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params

    const lecturer = await User.findById(id).select('name email role')
    if (!lecturer) {
      return NextResponse.json({ success: false, message: 'Lecturer not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const batchId        = searchParams.get('batchId')
    const semesterNumber = searchParams.get('semesterNumber')

    let query = { taughtBy: id }
    if (batchId)        query.batchId = batchId
    if (semesterNumber) query.semesterNumber = Number(semesterNumber)

    const logs = await LectureLog.find(query)
      .populate({
        path: 'subjectAssignmentId',
        select: 'subjectId batchId semesterNumber',
        populate: { path: 'subjectId', select: 'code name credits' }
      })
      .populate('batchId', 'name programme')
      .populate('loggedBy', 'name')
      .sort({ date: 1, startTime: 1 })

    // group sessions by subject + batch + semester so the report reads like
    // the department's own per-subject lecture sheet
    const groups = {}
    let grandTotalHours = 0

    for (const log of logs) {
      const subjectCode = log.subjectAssignmentId?.subjectId?.code || 'Unknown'
      const subjectName = log.subjectAssignmentId?.subjectId?.name || ''
      const batchName    = log.batchId?.name || 'Unknown batch'
      const key = `${subjectCode}__${batchName}__sem${log.semesterNumber}`

      if (!groups[key]) {
        groups[key] = {
          subjectCode,
          subjectName,
          batchName,
          programme: log.batchId?.programme,
          semesterNumber: log.semesterNumber,
          sessions: [],
          totalHours: 0,
        }
      }

      groups[key].sessions.push({
        _id: log._id,
        date: log.date,
        startTime: log.startTime,
        endTime: log.endTime,
        durationHours: log.durationHours,
        notes: log.notes,
        loggedByName: log.loggedBy?.name,
      })
      groups[key].totalHours += log.durationHours
      grandTotalHours += log.durationHours
    }

    const subjectGroups = Object.values(groups).sort((a, b) =>
      a.subjectCode.localeCompare(b.subjectCode)
    )

    return NextResponse.json({
      success: true,
      lecturer,
      subjectGroups,
      grandTotalHours: Math.round(grandTotalHours * 100) / 100,
      totalSessions: logs.length,
    })
  } catch (error) {
    console.error('lecturer report error', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}