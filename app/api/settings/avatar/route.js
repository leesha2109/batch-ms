import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import "@/lib/models-registry";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, or WEBP allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 3MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.type.split("/")[1];
    const filename = `${session.user.id}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const publicPath = `/uploads/avatars/${filename}`;

    await dbConnect();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { profilePicture: publicPath },
      { new: true }
    ).select("-password");

    return NextResponse.json({ user, profilePicture: publicPath });
  } catch (err) {
    console.error("POST /api/settings/avatar error:", err);
    return NextResponse.json({ error: "Failed to upload picture" }, { status: 500 });
  }
}