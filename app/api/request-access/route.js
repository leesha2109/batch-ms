// app/api/request-access/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import AccessRequest from "@/models/AccessRequest";

export async function POST(request) {
  await connectDB()
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, role, studentNumber } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }
    if (role === "student" && !studentNumber) {
      return NextResponse.json(
        { message: "Student number is required" },
        { status: 400 },
      );
    }

    const newRequest = await AccessRequest.create({
      name,
      email,
      role,
      studentNumber: studentNumber || null,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Request submitted", id: newRequest._id },
      { status: 200 },
    );
  } catch (err) {
    console.error("request-access POST error", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const requests = await AccessRequest.find().lean();
    return NextResponse.json({ success: true, requests });
  } catch (err) {
    console.error("request-access GET error", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}
