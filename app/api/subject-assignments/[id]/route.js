import connectDB from "@/lib/mongoose";
import SubjectAssignment from "@/models/SubjectAssignment";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import "@/lib/modelsRegistry";

function normalizeUpdatePayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  const update = {};

  for (const [key, value] of Object.entries(body)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        update[`${key}.${nestedKey}`] = nestedValue;
      }
    } else {
      update[key] = value;
    }
  }

  return update;
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    let normalizedBody = normalizeUpdatePayload(body);

    if (["hod", "coordinator"].includes(session.user.role)) {
      // full access
    } else if (session.user.role === "lecturer") {
      const assignment =
        await SubjectAssignment.findById(id).select("lecturerId");
      if (!assignment) {
        return NextResponse.json(
          { success: false, message: "Assignment not found" },
          { status: 404 },
        );
      }
      if (
        !assignment.lecturerId ||
        String(assignment.lecturerId) !== session.user.id
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const allowed = {};
      for (const key of ["paperSetting", "paperMarking"]) {
        if (
          body[key] &&
          typeof body[key] === "object" &&
          !Array.isArray(body[key])
        ) {
          for (const [nestedKey, nestedValue] of Object.entries(body[key])) {
            allowed[`${key}.${nestedKey}`] = nestedValue;
          }
        }
      }

      if (Object.keys(allowed).length === 0) {
        return NextResponse.json(
          { success: false, message: "No permitted fields to update" },
          { status: 400 },
        );
      }

      normalizedBody = allowed;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await SubjectAssignment.findByIdAndUpdate(
      id,
      { $set: normalizedBody },
      { new: true, runValidators: true },
    ).populate([
      { path: "subjectId", select: "code name credits type" },
      { path: "lecturerId", select: "name email role" },
    ]);

    return NextResponse.json({ success: true, assignment });
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
    if (!session || !["hod", "coordinator"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    await SubjectAssignment.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
