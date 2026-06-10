import connectDB from '@/lib/mongoose'
import User from '@/models/User'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const student = await User.findById(params.id)
      .select('-password')
      .populate('batchId', 'name programme intakeYear')

    if (!student || student.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, student })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body    = await req.json()
    const student = await User.findByIdAndUpdate(params.id, body, { new: true })
      .select('-password')
      .populate('batchId', 'name programme intakeYear')

    return NextResponse.json({ success: true, student })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}