import '@/lib/modelsRegistry'
import connectDB from '@/lib/mongoose'
import LectureLog from '@/models/LectureLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'

function hoursBetween(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const start = sh * 60 + sm
  const end   = eh * 60 + em
  const diff  = end - start
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
}

// GET — list lecture logs, filterable by batch, semester, subjectAssignment, taughtBy
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const batchId             = searchParams.get('batchId')
    const semesterNumber      = searchParams.get('semesterNumber')
    const subjectAssignmentId = searchParams.get('subjectAssignmentId')
    const taughtBy            = searchParams.get('taughtBy')

    let query = {}
    if (batchId)             query.batchId = batchId
    if (semesterNumber)      query.semesterNumber = Number(semesterNumber)
    if (subjectAssignmentId) query.subjectAssignmentId = subjectAssignmentId
    if (taughtBy)             query.taughtBy = taughtBy

    const logs = await LectureLog.find(query)
      .populate({
        path: 'subjectAssignmentId',
        select: 'subjectId lecturerId',
        populate: { path: 'subjectId', select: 'code name credits' }
      })
      .populate('batchId', 'name programme')
      .populate('taughtBy', 'name role')
      .populate('loggedBy', 'name role')
      .sort({ date: -1, startTime: -1 })

    return NextResponse.json({ success: true, logs })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST — create a new lecture log entry. Open to any authenticated role.
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const {
      subjectAssignmentId, batchId, semesterNumber,
      date, startTime, endTime, taughtBy, notes
    } = body

    if (!subjectAssignmentId || !batchId || !semesterNumber || !date || !startTime || !endTime || !taughtBy) {
      return NextResponse.json(
        { success: false, message: 'Subject, batch, semester, date, time and who taught the class are required' },
        { status: 400 }
      )
    }

    const durationHours = hoursBetween(startTime, endTime)
    if (durationHours <= 0) {
      return NextResponse.json(
        { success: false, message: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const log = await LectureLog.create({
      subjectAssignmentId,
      batchId,
      semesterNumber,
      date,
      startTime,
      endTime,
      durationHours,
      taughtBy,
      loggedBy: session.user.id,
      notes: notes || '',
    })

    const populated = await log.populate([
      {
        path: 'subjectAssignmentId',
        select: 'subjectId lecturerId',
        populate: { path: 'subjectId', select: 'code name credits' }
      },
      { path: 'batchId', select: 'name programme' },
      { path: 'taughtBy', select: 'name role' },
      { path: 'loggedBy', select: 'name role' },
    ])

    return NextResponse.json(
      { success: true, message: 'Lecture logged', log: populated },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}