import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { NextResponse } from "next/server";

// GET all users
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["hod", "coordinator"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // filter by role
    const search = searchParams.get("search"); // search by name or email

    let query = {};
    if (role) query.role = role;
    if (search)
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];

    let users = [];
    try {
      users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .populate({
          path: "coordinatorId",
          select: "name email role",
          options: { strictPopulate: false },
        });
    } catch {
      users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST — create new user
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["hod", "coordinator"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await req.json();
    const { name, email, password, role, batchId, coordinatorId } = body;

    // validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, password and role are required",
        },
        { status: 400 },
      );
    }

    // check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      batchId: batchId || null,
      coordinatorId: coordinatorId || null,
      isActive: true,
    });

    let populatedUser = null;
    try {
      populatedUser = await User.findById(user._id)
        .populate({
          path: "coordinatorId",
          select: "name email role",
          options: { strictPopulate: false },
        })
        .select("-password");
    } catch {
      populatedUser = await User.findById(user._id).select("-password");
    }

    const userWithoutPassword = populatedUser.toObject();

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
