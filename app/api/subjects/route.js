import mongoose from 'mongoose'
import connectDB from '@/lib/mongoose'
import Subject from '@/models/Subjects'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'

// GET all subjects
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const programme = searchParams.get('programme')
    const search    = searchParams.get('search')

    let query = { isActive: true }
    if (programme) query.programme = programme
    if (search)    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ]

    const subjects = await Subject.find(query).sort({ code: 1 })
    return NextResponse.json({ success: true, subjects })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST — create subject(s)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const {
      programme,
      name, credits, type, description,
      code, level, semester,
      bscCode, bscLevel, bscSemester,
      bcsCode, bcsSemester,
    } = body

    if (!name || !credits || !programme) {
      return NextResponse.json(
        { success: false, message: 'Name, credits and programme are required' },
        { status: 400 }
      )
    }

    // ── Case 1: single programme (BSc or BCS only) ──
    if (programme === 'BSc' || programme === 'BCS') {
      if (!code || !level || !semester) {
        return NextResponse.json(
          { success: false, message: 'Code, level and semester are required' },
          { status: 400 }
        )
      }

      const existing = await Subject.findOne({ code: code.toUpperCase() })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Subject code already exists' },
          { status: 400 }
        )
      }

      const subject = await Subject.create({
        code, name, credits, type, programme, level, semester, description
      })

      return NextResponse.json(
        { success: true, message: 'Subject created', subject },
        { status: 201 }
      )
    }

    // ── Case 2: 'Both' — create BSc row + BCS row, linked by groupId ──
    if (programme === 'Both') {
      if (!bscCode || !bscLevel || !bscSemester) {
        return NextResponse.json(
          { success: false, message: 'BSc code, level and semester are required' },
          { status: 400 }
        )
      }
      if (!bcsCode || !bcsSemester) {
        return NextResponse.json(
          { success: false, message: 'BCS code and semester are required' },
          { status: 400 }
        )
      }

      const existingBsc = await Subject.findOne({ code: bscCode.toUpperCase() })
      if (existingBsc) {
        return NextResponse.json(
          { success: false, message: `BSc code ${bscCode} already exists` },
          { status: 400 }
        )
      }
      const existingBcs = await Subject.findOne({ code: bcsCode.toUpperCase() })
      if (existingBcs) {
        return NextResponse.json(
          { success: false, message: `BCS code ${bcsCode} already exists` },
          { status: 400 }
        )
      }

      const groupId = new mongoose.Types.ObjectId().toString()

      const bscSubject = await Subject.create({
        code: bscCode, name, credits, type,
        programme: 'BSc', level: bscLevel, semester: bscSemester,
        description, groupId
      })

      const bcsSubject = await Subject.create({
        code: bcsCode, name, credits, type,
        programme: 'BCS', level: 1, semester: bcsSemester,
        description, groupId
      })

      return NextResponse.json(
        { success: true, message: 'Subjects created for both programmes', subjects: [bscSubject, bcsSubject] },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Invalid programme' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}