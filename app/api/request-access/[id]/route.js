import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import AccessRequest from '@/models/AccessRequest'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function PATCH(request, { params }) {
  await connectDB()

  const { id } = await params   // ← fix: await params first

  const { status } = await request.json()

  const accessRequest = await AccessRequest.findById(id)
  if (!accessRequest) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  accessRequest.status = status
  await accessRequest.save()

  if (status === 'approved') {
    const existingUser = await User.findOne({ email: accessRequest.email })

    if (!existingUser) {
      const defaultPassword = accessRequest.studentNumber || 'Welcome@123'
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)

      await User.create({
        name: accessRequest.name,
        email: accessRequest.email,
        password: hashedPassword,
        role: accessRequest.role,
        studentNumber: accessRequest.studentNumber || null,
      })
    }
  }

  return NextResponse.json({ message: 'Updated', status })
}