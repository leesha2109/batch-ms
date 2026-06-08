import connectDB from "@/lib/mongoose";
import Batch from "@/models/Batch";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// GET all batches
export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
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
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "hod") {
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

    const semesterCount = programme === "BSc" ? 4 : programme === "BCS" ? 2 : 0;
    const semesters = Array.from({ length: semesterCount }, (_, i) => ({
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
