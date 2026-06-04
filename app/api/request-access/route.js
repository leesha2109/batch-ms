// app/api/request-access/route.js
import { NextResponse } from 'next/server'

// In-memory store (swap with DB in production)
export const accessRequests = []

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, role, studentNumber } = body

    if (!name || !email || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }
    if (role === 'student' && !studentNumber) {
      return NextResponse.json({ message: 'Student number is required' }, { status: 400 })
    }

    const newRequest = {
      id: Date.now().toString(),
      name,
      email,
      role,
      studentNumber: studentNumber || null,
      status: 'pending',         // ← always starts pending
      createdAt: new Date().toISOString()
    }

    accessRequests.push(newRequest)
    return NextResponse.json({ message: 'Request submitted', id: newRequest.id }, { status: 200 })

  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ requests: accessRequests })
}