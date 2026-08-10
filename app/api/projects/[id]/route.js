import connectDB from '@/lib/mongoose'
import Project from '@/models/Project'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const project = await Project.findById(id)
      .populate('subjectId',    'code name type programme')
      .populate('supervisorId', 'name email')
      .populate('students',     'name email studentId')
    if (!project) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, project })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const body = await req.json()

    // students can only update milestones, status and description
    // hod/coordinator can update anything
    const allowedFields = ['hod', 'coordinator'].includes(session.user.role)
      ? body
      : {
          ...(body.status      !== undefined && { status:      body.status      }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.marks       !== undefined && { marks:       body.marks       }),
          ...Object.fromEntries(
            Object.entries(body).filter(([k]) => k.startsWith('milestones.'))
          ),
        }

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: allowedFields },  // $set handles dot-notation like milestones.titleConfirmed correctly
      { returnDocument: 'after' }
    )
      .populate('subjectId',    'code name type programme')
      .populate('supervisorId', 'name email')
      .populate('students',     'name email studentId')

    if (!project) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, project })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const { id } = await params
    await Project.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'Project deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}