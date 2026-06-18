import connectDB from '@/lib/mongoose'
import Subject from '@/models/Subjects'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const body    = await req.json()
    const subject = await Subject.findByIdAndUpdate(id, body, { new: true })

    if (!subject) return NextResponse.json(
      { success: false, message: 'Subject not found' }, { status: 404 }
    )

    return NextResponse.json({ success: true, message: 'Subject updated', subject })
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
    await Subject.findByIdAndUpdate(id, { isActive: false })

    return NextResponse.json({ success: true, message: 'Subject deactivated' })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}