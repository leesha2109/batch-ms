import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Project from '@/models/Project'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['hod', 'coordinator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) return NextResponse.json(
      { success: false, message: 'No file uploaded' }, { status: 400 }
    )

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects')
    await mkdir(uploadDir, { recursive: true })

    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/projects/${filename}`

    const project = await Project.findByIdAndUpdate(
      id,
      { $push: { documents: { name: file.name, url: fileUrl } } },
      { new: true }
    )

    return NextResponse.json({ success: true, document: { name: file.name, url: fileUrl }, project })
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
    const { docUrl } = await req.json()

    await Project.findByIdAndUpdate(
      id,
      { $pull: { documents: { url: docUrl } } },
      { new: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}