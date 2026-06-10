import connectDB from '@/lib/mongoose'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'

// GET students — optionally filter by batchId
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get('batchId')
    const search  = searchParams.get('search')

    let query = { role: 'student' }
    if (batchId) query.batchId = batchId
    if (search)  query.$or = [
      { name:      { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ]

    const students = await User.find(query)
      .select('-password')
      .populate('batchId', 'name programme intakeYear')
      .sort({ createdAt: -1 })

    return NextResponse.json({ success: true, students })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST — enroll new student
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { name, email, password, batchId,
            studentId, phone, address, dateOfBirth } = body

    if (!name || !email || !password || !batchId) {
      return NextResponse.json(
        { success: false, message: 'Name, email, password and batch are required' },
        { status: 400 }
      )
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const student = await User.create({
      name, email,
      password: hashedPassword,
      role: 'student',
      batchId,
      studentId:   studentId  || '',
      phone:       phone      || '',
      address:     address    || '',
      dateOfBirth: dateOfBirth || null,
      enrolledAt:  new Date(),
      isActive: true
    })

    const { password: _, ...safe } = student.toObject()
    return NextResponse.json(
      { success: true, message: 'Student enrolled', student: safe },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}