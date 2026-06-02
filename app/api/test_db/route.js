import connectDB from '@/lib/mongoose'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectDB()
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connected successfully!' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}