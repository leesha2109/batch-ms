import connectDB from '@/lib/mongoose'
import SubjectAssignment from '@/models/SubjectAssignment'
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
    const { id } = await params   // ← await params before destructuring
    const body       = await req.json()
    const assignment = await SubjectAssignment.findByIdAndUpdate(
      id, body, { returnDocument: 'after' }   // also fixes the `new` deprecation warning
    ).populate([
      { path: 'subjectId',  select: 'code name credits type' },
      { path: 'lecturerId', select: 'name email role' }
    ])

    return NextResponse.json({ success: true, assignment })
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
    const { id } = await params   // ← same fix here
    await SubjectAssignment.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'Assignment removed' })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}