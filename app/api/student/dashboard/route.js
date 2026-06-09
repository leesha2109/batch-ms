import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import connectDB from '@/lib/mongoose'
import Announcement from '@/models/Announcement'
import Timetable from '@/models/Timetable'
import User from '@/models/User'

export async function GET() {
  await connectDB()
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const user = await User.findOne({ email: session.user.email })
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  const batchId = user.batchId

  const [announcements, timetable, deadlines] = await Promise.all([
    Announcement.find({
      $or: [{ batchId }, { batchId: null }]
    }).sort({ createdAt: -1 }).limit(5).lean(),

    Timetable.find({ batchId }).sort({ day: 1, startTime: 1 }).lean(),


  ])

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      studentNumber: user.studentNumber,
      batchId: user.batchId,
    },
    announcements,
    timetable,

  })
}