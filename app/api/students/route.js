import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";

const DEFAULT_STUDENT_PASSWORD =
  process.env.DEFAULT_STUDENT_PASSWORD || "student123";
const LOGIN_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}/login`
  : "http://localhost:3000/login";

async function sendStudentWelcomeEmail({ to, name, password }) {
  const subject = "Your BatchMS student account is ready";
  const text = `Hello ${name},\n\nYour BatchMS student account has been created.\n\nEmail: ${to}\nPassword: ${password}\n\nYou can log in here: ${LOGIN_URL}\n\nPlease change your password after your first login.`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your <strong>BatchMS</strong> student account has been created.</p>
    <ul>
      <li><strong>Email:</strong> ${to}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p>You can log in here: <a href="${LOGIN_URL}">${LOGIN_URL}</a></p>
    <p>Please change your password after your first login.</p>
  `;

  await sendEmail({ to, subject, text, html });
}

// GET students — optionally filter by batchId
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const search = searchParams.get("search");

    let query = { role: "student" };
    if (batchId) query.batchId = batchId;
    if (search)
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];

    const students = await User.find(query)
      .select("-password")
      .populate("batchId", "name programme intakeYear")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST — enroll new student
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["hod", "coordinator"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      name,
      email,
      password,
      batchId,
      studentId,
      phone,
      address,
      dateOfBirth,
    } = body;

    if (!name || !email || !batchId) {
      return NextResponse.json(
        { success: false, message: "Name, email and batch are required" },
        { status: 400 },
      );
    }

    const finalPassword = password?.trim()
      ? password.trim()
      : DEFAULT_STUDENT_PASSWORD;

    if (password && password.trim().length > 0 && password.trim().length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters when provided",
        },
        { status: 400 },
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      batchId,
      studentId: studentId || "",
      phone: phone || "",
      address: address || "",
      dateOfBirth: dateOfBirth || null,
      enrolledAt: new Date(),
      isActive: true,
    });

    try {
      await sendStudentWelcomeEmail({
        to: email,
        name,
        password: finalPassword,
      });
    } catch (emailError) {
      await User.findByIdAndDelete(student._id).catch(() => null);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to send welcome email: ${emailError.message}`,
        },
        { status: 500 },
      );
    }

    const { password: _, ...safe } = student.toObject();
    return NextResponse.json(
      { success: true, message: "Student enrolled", student: safe },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
