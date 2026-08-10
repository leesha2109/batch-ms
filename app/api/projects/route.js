import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Project from '@/models/Project'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const batchId   = searchParams.get('batchId')
    const level     = searchParams.get('level')
    const semester  = searchParams.get('semester')
    const subjectId = searchParams.get('subjectId')
    const studentId = searchParams.get('studentId') // ← new

    const query = {}
    if (batchId)   query.batchId   = batchId
    if (level)     query.level     = Number(level)
    if (semester)  query.semester  = Number(semester)
    if (subjectId && subjectId !== 'undefined') query.subjectId = subjectId
    if (studentId) query.students  = studentId // ← matches if studentId is in the array

    const projects = await Project.find(query)
      .populate('subjectId',    'code name type programme')
      .populate('supervisorId', 'name email')
      .populate('students',     'name email studentId')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ success: true, projects })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const {
      title, description, type,
      batchId, level, semester,
      subjectId, supervisorId,
      students, status, startDate
    } = body

    if (!title || !type || !batchId) {
      return NextResponse.json(
        { success: false, message: 'Title, type and batch are required' },
        { status: 400 }
      )
    }

    const project = await Project.create({
      title,
      description:  description  || '',
      type,
      batchId,
      level:        level        ? Number(level)    : null,
      semester:     semester     ? Number(semester) : null,
      subjectId:    subjectId    || null,
      supervisorId: supervisorId || null,
      students:     students     || [],
      status:       status       || 'not_started',
      startDate:    startDate    || null,
    })

    return NextResponse.json({ success: true, project }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}