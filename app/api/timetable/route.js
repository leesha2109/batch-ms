import connectDB from '@/lib/mongoose'
import Timetable from '@/models/Timetable'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'

// GET timetable for a batch + semester
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const batchId        = searchParams.get('batchId')
    const semesterNumber = searchParams.get('semesterNumber')
    const year           = searchParams.get('year')

    const timetable = await Timetable.findOne({ batchId, semesterNumber, year })
      .populate({
        path: 'slots.subjectAssignmentId',
        populate: [
          { path: 'subjectId',  select: 'code name' },
          { path: 'lecturerId', select: 'name' }
        ]
      })

    return NextResponse.json({ success: true, timetable })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST — create or update full timetable
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { batchId, semesterNumber, year, slots } = body

    // upsert — create if not exists, update if exists
    const timetable = await Timetable.findOneAndUpdate(
      { batchId, semesterNumber, year },
      { slots },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, timetable })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}