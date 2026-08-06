import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // adjust to your actual path
import dbConnect from "@/lib/dbConnect";
import "@/lib/modelsRegistry";
import ExamTimetable from "@/models/ExamTimetable";

const AUTHORIZED_ROLES = ["hod", "coordinator"];

export async function GET(request) {
  try {
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

    const entries = await ExamTimetable.find({
      batch,
      semester: Number(semester),
    })
      .populate("subject", "name code")
      .sort({ examDate: 1, startTime: 1 });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("GET /api/exam-timetable error:", err);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !AUTHORIZED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const {
      batch,
      semester,
      subject,
      examDate,
      startTime,
      endTime,
      venue,
      examType,
    } = body;

    if (
      !batch ||
      !semester ||
      !subject ||
      !examDate ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const entry = await ExamTimetable.create({
      batch,
      semester,
      subject,
      examDate,
      startTime,
      endTime,
      venue,
      examType: examType || "theory",
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("POST /api/exam-timetable error:", err);
    return NextResponse.json(
      { error: "Failed to create timetable entry" },
      { status: 500 },
    );
  }
}
