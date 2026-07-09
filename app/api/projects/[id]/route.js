import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Project from '@/models/Project'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const project = await Project.findByIdAndUpdate(id, body, { new: true })
    if (!project) return NextResponse.json(
      { success: false, message: 'Not found' }, { status: 404 }
    )

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