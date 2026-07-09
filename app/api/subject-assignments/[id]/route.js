import connectDB from '@/lib/mongoose'
import SubjectAssignment from '@/models/SubjectAssignment'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'

function normalizeUpdatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {}
  }

  const update = {}

  for (const [key, value] of Object.entries(body)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        update[`${key}.${nestedKey}`] = nestedValue
      }
    } else {
      update[key] = value
    }
  }

  return update
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()
    const normalizedBody = normalizeUpdatePayload(body)

    const assignment = await SubjectAssignment.findByIdAndUpdate(
      id,
      { $set: normalizedBody },
      { new: true, runValidators: true }
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
    const { id } = await params
    await SubjectAssignment.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'Assignment removed' })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}