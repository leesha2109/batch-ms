import connectDB from "@/lib/mongoose";
import Batch from "@/models/Batch";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { NextResponse } from "next/server";

// GET all batches
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const batches = await Batch.find()
      .populate("coordinatorId", "name email")
      .sort({ intakeYear: -1 });

    return NextResponse.json({ success: true, batches });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST — create new batch
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "hod") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      name,
      programme,
      intakeYear,
      coordinatorId,
      totalCreditsRequired,
      graduationTarget,
      status,
    } = body;

    if (!name || !programme || !intakeYear) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, programme and intake year are required",
        },
        { status: 400 },
      );
    }

    // auto generate 8 planned semesters
    const semesters = Array.from({ length: 8 }, (_, i) => ({
      semesterNumber: i + 1,
      status: "planned",
    }));

    const batch = await Batch.create({
      name,
      programme,
      intakeYear,
      coordinatorId: coordinatorId || null,
      totalCreditsRequired: totalCreditsRequired || 120,
      graduationTarget,
      status: status || "active",
      semesters,
    });

    return NextResponse.json(
      { success: true, message: "Batch created successfully", batch },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
