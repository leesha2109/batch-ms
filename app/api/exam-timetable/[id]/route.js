import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; 
import dbConnect from "@/lib/dbConnect";
import "@/lib/modelsRegistry";
import ExamTimetable from "@/models/ExamTimetable";

const AUTHORIZED_ROLES = ["hod", "coordinator"];

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !AUTHORIZED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params; // must be awaited in this Next.js version

    const body = await request.json();
    const entry = await ExamTimetable.findByIdAndUpdate(
      id,
      { ...body, updatedBy: session.user.id },
      { new: true }
    ).populate("subject", "name code");

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (err) {
    console.error("PATCH /api/exam-timetable/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !AUTHORIZED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const deleted = await ExamTimetable.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/exam-timetable/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}