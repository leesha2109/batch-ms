import '@/lib/modelsRegistry'
import connectDB from '@/lib/mongoose'
import LectureLog from '@/models/LectureLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'

function hoursBetween(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
}

// PATCH — edit a log entry. Anyone who logged it, or HOD/coordinator, can edit.
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params

    const existing = await LectureLog.findById(id)
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Log not found' }, { status: 404 })
    }

    const canEdit =
      existing.loggedBy.toString() === session.user.id ||
      ['hod', 'coordinator'].includes(session.user.role)

    if (!canEdit) {
      return NextResponse.json({ success: false, message: 'Not allowed to edit this entry' }, { status: 403 })
    }

    const body = await req.json()
    const { date, startTime, endTime, notes, taughtBy } = body

    const update = {}
    if (date)      update.date = date
    if (startTime) update.startTime = startTime
    if (endTime)   update.endTime = endTime
    if (notes !== undefined) update.notes = notes
    if (taughtBy)  update.taughtBy = taughtBy

    if (startTime || endTime) {
      const finalStart = startTime || existing.startTime
      const finalEnd   = endTime   || existing.endTime
      update.durationHours = hoursBetween(finalStart, finalEnd)
      if (update.durationHours <= 0) {
        return NextResponse.json(
          { success: false, message: 'End time must be after start time' },
          { status: 400 }
        )
      }
    }

    const log = await LectureLog.findByIdAndUpdate(id, update, { new: true })
      .populate({
        path: 'subjectAssignmentId',
        select: 'subjectId lecturerId',
        populate: { path: 'subjectId', select: 'code name credits' }
      })
      .populate('taughtBy', 'name role')
      .populate('loggedBy', 'name role')

    return NextResponse.json({ success: true, message: 'Log updated', log })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// DELETE — remove a log entry. Same permission rule as edit.
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params

    const existing = await LectureLog.findById(id)
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Log not found' }, { status: 404 })
    }

    const canDelete =
      existing.loggedBy.toString() === session.user.id ||
      ['hod', 'coordinator'].includes(session.user.role)

    if (!canDelete) {
      return NextResponse.json({ success: false, message: 'Not allowed to delete this entry' }, { status: 403 })
    }

    await LectureLog.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'Log deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}