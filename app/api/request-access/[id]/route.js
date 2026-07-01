import connectDB from "@/lib/mongoose";
import AccessRequest from "@/models/AccessRequest";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const doc = await AccessRequest.findById(resolvedParams.id).lean();
    if (!doc)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, request: doc });
  } catch (err) {
    console.error("request-access [id] GET error", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["hod", "coordinator"].includes(session.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();
    const body = await req.json();
    const { action } = body;
    const resolvedParams = await params;

    const reqDoc = await AccessRequest.findById(resolvedParams.id);
    if (!reqDoc)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    if (action === "reject") {
      reqDoc.status = "rejected";
      await reqDoc.save();
      return NextResponse.json({ success: true, request: reqDoc });
    }

    if (action === "approve") {
      // if caller provided a password and wants the API to create the user, do so
      const { password, createUser, role: selectedRole, coordinatorId } = body || {};
      if (createUser) {
        if (!password) {
          return NextResponse.json(
            { success: false, message: "Password required to create user" },
            { status: 400 },
          );
        }

        const existing = await User.findOne({ email: reqDoc.email });
        if (existing)
          return NextResponse.json(
            { success: false, message: "User already exists" },
            { status: 400 },
          );

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
          name: reqDoc.name,
          email: reqDoc.email,
          password: hashed,
          role: selectedRole || (reqDoc.role === "student" ? "student" : reqDoc.role),
          coordinatorId: selectedRole === "visiting_lecturer" ? (coordinatorId || reqDoc.coordinatorId || null) : null,
          isActive: true,
        });

        reqDoc.status = "approved";
        await reqDoc.save();

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        return NextResponse.json({ success: true, user: userWithoutPassword });
      }

      // no createUser flag — just mark approved
      reqDoc.status = "approved";
      await reqDoc.save();
      return NextResponse.json({ success: true, request: reqDoc });
    }

    return NextResponse.json(
      { success: false, message: "Unknown action" },
      { status: 400 },
    );
  } catch (err) {
    console.error("request-access [id] PATCH error", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}
