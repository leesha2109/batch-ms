import connectDB from "@/lib/mongoose";
import Batch from "@/models/Batch";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// GET single batch
export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const batch = await Batch.findById(id).populate(
      "coordinatorId",
      "name email",
    );

    if (!batch) {
      return NextResponse.json(
        { success: false, message: "Batch not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, batch });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// PATCH — update batch
export async function PATCH(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !["hod", "coordinator"].includes(token.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const batch = await Batch.findByIdAndUpdate(id, body, {
      returnDocument: "after",
    }).populate("coordinatorId", "name email");

    if (!batch) {
      return NextResponse.json(
        { success: false, message: "Batch not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Batch updated",
      batch,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE — delete batch
export async function DELETE(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "hod") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    await Batch.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Batch deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
