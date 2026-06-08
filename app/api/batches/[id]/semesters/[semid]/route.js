import connectDB from "@/lib/mongoose";
import Batch from "@/models/Batch";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// PATCH — update a specific semester inside a batch
export async function PATCH(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !["hod", "coordinator"].includes(token.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id, semid } = await params;
    const body = await req.json();
    const { startDate, endDate, status } = body;

    const batch = await Batch.findOneAndUpdate(
      {
        _id: id,
        "semesters._id": semid,
      },
      {
        $set: {
          "semesters.$.startDate": startDate,
          "semesters.$.endDate": endDate,
          "semesters.$.status": status,
        },
      },
      { returnDocument: "after" },
    ).populate("coordinatorId", "name email");

    if (!batch) {
      return NextResponse.json(
        { success: false, message: "Batch or semester not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Semester updated",
      batch,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
