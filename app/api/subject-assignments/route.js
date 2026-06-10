import connectDB from '@/lib/mongoose'
import SubjectAssignment from '@/models/SubjectAssignment'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'

// GET assignments — filter by batchId + semesterNumber
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const batchId        = searchParams.get('batchId')
    const semesterNumber = searchParams.get('semesterNumber')

    let query = {}
    if (batchId)        query.batchId        = batchId
    if (semesterNumber) query.semesterNumber  = Number(semesterNumber)

    const assignments = await SubjectAssignment.find(query)
      .populate('subjectId',  'code name credits type')
      .populate('lecturerId', 'name email role')
      .sort({ createdAt: 1 })

    return NextResponse.json({ success: true, assignments })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST — assign subject to batch + semester
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { subjectId, batchId, semesterNumber, lecturerId, year } = body

    if (!subjectId || !batchId || !semesterNumber || !year) {
      return NextResponse.json(
        { success: false, message: 'subjectId, batchId, semesterNumber and year are required' },
        { status: 400 }
      )
    }

    // prevent duplicate assignment
    const existing = await SubjectAssignment.findOne({
      subjectId, batchId, semesterNumber
    })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'This subject is already assigned to this semester' },
        { status: 400 }
      )
    }

    const assignment = await SubjectAssignment.create({
      subjectId, batchId, semesterNumber,
      lecturerId: lecturerId || null,
      year
    })

    const populated = await assignment.populate([
      { path: 'subjectId',  select: 'code name credits type' },
      { path: 'lecturerId', select: 'name email role' }
    ])

    return NextResponse.json(
      { success: true, message: 'Subject assigned', assignment: populated },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}