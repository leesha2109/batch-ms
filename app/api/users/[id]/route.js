import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { NextResponse } from "next/server";

// PATCH — update user
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["hod", "coordinator"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const resolvedParams = await params;

    const body = await req.json();
    const { name, email, role, batchId, isActive, password } = body;

    const updateData = { name, email, role, batchId, isActive };

    // only update password if a new one is provided
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(resolvedParams.id, updateData, {
      new: true,
    }).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "User updated", user });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE — deactivate user (soft delete)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["hod", "coordinator"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const resolvedParams = await params;

    // soft delete — just mark as inactive
    const user = await User.findByIdAndUpdate(
      resolvedParams.id,
      { isActive: false },
      { new: true },
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "User deactivated" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
