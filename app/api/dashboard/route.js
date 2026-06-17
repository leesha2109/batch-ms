import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import Batch from "@/models/Batch";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const totalStudents = await User.countDocuments({ role: "student" });
    const totalLecturers = await User.countDocuments({ role: "lecturer" });
    const totalVisiting = await User.countDocuments({
      role: "visiting_lecturer",
    });
    
    const totalBatches = await Batch.countDocuments({ status: "active" });
    const bscActive     = await Batch.countDocuments({ status: "active", programme: "BSc" });
    const bcsActive     = await Batch.countDocuments({ status: "active", programme: "BCS" });

    return NextResponse.json({
      success: true,
      totalStudents,
      totalLecturers,
      totalVisiting,
      totalBatches,
      bscActive,
      bcsActive,
    });
  } catch (error) {
    console.error("hod-stats error", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
