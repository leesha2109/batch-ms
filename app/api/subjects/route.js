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
    if (programme) query.programme = { $in: [programme, 'Both'] }
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

// POST — create subject
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { code, name, credits, type, programme, description } = body

    if (!code || !name || !credits) {
      return NextResponse.json(
        { success: false, message: 'Code, name and credits are required' },
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
      code, name, credits, type, programme, description
    })

    return NextResponse.json(
      { success: true, message: 'Subject created', subject },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}