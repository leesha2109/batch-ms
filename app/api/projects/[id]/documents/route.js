import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Project from "@/models/Project";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const project = await Project.findById(id).select("students");
    if (!project)
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );

    const isProjectStudent = project.students
      .map(String)
      .includes(session.user.id);
    if (
      !["hod", "coordinator"].includes(session.user.role) &&
      !isProjectStudent
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const docKey = formData.get("docKey");
    const docLabel = formData.get("docLabel");

    if (!file)
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 },
      );
    if (!docKey || !docLabel)
      return NextResponse.json(
        { success: false, message: "Document key and label are required" },
        { status: 400 },
      );

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "projects");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/projects/${filename}`;

    await Project.findByIdAndUpdate(
      id,
      { $pull: { documents: { key: docKey } } },
      { new: true },
    );

    const updated = await Project.findByIdAndUpdate(
      id,
      {
        $push: {
          documents: {
            key: docKey,
            label: docLabel,
            name: file.name,
            url: fileUrl,
          },
        },
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      document: { key: docKey, label: docLabel, name: file.name, url: fileUrl },
      project: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const { docUrl } = await req.json();

    const project = await Project.findById(id).select("students");
    if (!project)
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );

    const isProjectStudent = project.students
      .map(String)
      .includes(session.user.id);
    if (
      !["hod", "coordinator"].includes(session.user.role) &&
      !isProjectStudent
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await Project.findByIdAndUpdate(
      id,
      { $pull: { documents: { url: docUrl } } },
      { new: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
