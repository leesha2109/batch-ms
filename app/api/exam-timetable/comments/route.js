import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import "@/lib/modelsRegistry";
import ExamComment from "@/models/ExamComment";
import User from "@/models/User";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get("batch");
    const semester = searchParams.get("semester");

    if (!batch || !semester) {
      return NextResponse.json(
        { error: "batch and semester are required" },
        { status: 400 },
      );
    }

    const comments = await ExamComment.find({
      batch,
      semester: Number(semester),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, comments });
  } catch (err) {
    console.error("GET /api/exam-timetable/comments error:", err);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    await dbConnect();
    const body = await request.json();
    const { batch, semester, message } = body;

    if (!batch || !semester || !message) {
      return NextResponse.json(
        { error: "batch, semester and message are required" },
        { status: 400 },
      );
    }

    const user = await User.findById(session.user.id).select("name");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const comment = await ExamComment.create({
      batch,
      semester: Number(semester),
      student: session.user.id,
      studentName: user.name,
      message: message.trim(),
    });

    return NextResponse.json({ success: true, comment });
  } catch (err) {
    console.error("POST /api/exam-timetable/comments error:", err);
    return NextResponse.json(
      { error: "Failed to save comment" },
      { status: 500 },
    );
  }
}
