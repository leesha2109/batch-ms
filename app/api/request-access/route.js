import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import AccessRequest from '@/models/AccessRequest'

export async function POST(request) {
  await connectDB()
  try {
    const { name, email, role, studentNumber } = await request.json()

    if (!name || !email || !role)
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    if (role === 'student' && !studentNumber)
      return NextResponse.json({ message: 'Student number is required' }, { status: 400 })

    await AccessRequest.create({ name, email, role, studentNumber })
    return NextResponse.json({ message: 'Request submitted' }, { status: 200 })

  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  await connectDB()
  const requests = await AccessRequest.find().sort({ createdAt: -1 })
  return NextResponse.json({ requests })
}