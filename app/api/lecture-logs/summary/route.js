import '@/lib/modelsRegistry'
import connectDB from '@/lib/mongoose'
import LectureLog from '@/models/LectureLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

// GET — aggregated totals: hours per lecturer, hours per subject, for a batch+semester
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const batchId        = searchParams.get('batchId')
    const semesterNumber = searchParams.get('semesterNumber')

    let match = {}
    if (batchId)        match.batchId = new mongoose.Types.ObjectId(batchId)
    if (semesterNumber) match.semesterNumber = Number(semesterNumber)

    // total hours per lecturer (taughtBy) — this is the payment-relevant number
    const byLecturer = await LectureLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$taughtBy',
          totalHours: { $sum: '$durationHours' },
          sessionCount: { $sum: 1 },
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          lecturerId: '$_id',
          name: '$user.name',
          role: '$user.role',
          totalHours: 1,
          sessionCount: 1,
        }
      },
      { $sort: { totalHours: -1 } }
    ])

    // total hours per subject assignment
    const bySubject = await LectureLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$subjectAssignmentId',
          totalHours: { $sum: '$durationHours' },
          sessionCount: { $sum: 1 },
        }
      },
      {
        $lookup: {
          from: 'subjectassignments',
          localField: '_id',
          foreignField: '_id',
          as: 'assignment'
        }
      },
      { $unwind: '$assignment' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'assignment.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' },
      {
        $lookup: {
          from: 'users',
          localField: 'assignment.lecturerId',
          foreignField: '_id',
          as: 'lecturer'
        }
      },
      {
        $project: {
          subjectAssignmentId: '$_id',
          subjectCode: '$subject.code',
          subjectName: '$subject.name',
          credits: '$subject.credits',
          assignedLecturer: { $arrayElemAt: ['$lecturer.name', 0] },
          totalHours: 1,
          sessionCount: 1,
        }
      },
      { $sort: { subjectCode: 1 } }
    ])

    return NextResponse.json({ success: true, byLecturer, bySubject })
  } catch (error) {
    console.error('lecture-logs summary error', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}