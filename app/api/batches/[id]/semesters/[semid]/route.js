import connectDB from "@/lib/mongoose";
import Batch from "@/models/Batch";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { NextResponse } from "next/server";

// PATCH — update a specific semester inside a batch
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "hod") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { startDate, endDate, status } = body;

    const batch = await Batch.findOneAndUpdate(
      {
        _id: params.id,
        "semesters._id": params.semid,
      },
      {
        $set: {
          "semesters.$.startDate": startDate,
          "semesters.$.endDate": endDate,
          "semesters.$.status": status,
        },
      },
      { new: true },
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
