import connectDB from '@/lib/mongoose'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectDB()

    const existing = await User.findOne({ email: 'hod@batchms.com' })
    if (existing) {
      return NextResponse.json({ message: 'HOD already exists' })
    }

    const hashedPassword = await bcrypt.hash('hod123456', 10)

    await User.create({
      name:     'Head of Department',
      email:    'hod@batchms.com',
      password: hashedPassword,
      role:     'hod'
    })

    return NextResponse.json({
      success: true,
      message: 'HOD created successfully',
      login: { email: 'hod@batchms.com', password: 'hod123456' }
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}