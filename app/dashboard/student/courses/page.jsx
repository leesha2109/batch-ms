"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBatches } from "@/hooks/useBatches";
import TopHeader from "@/components/TopHeader";

const SEMESTER_OPTIONS = [1, 2];

export default function StudentCoursesPage() {
  const { data: session, status } = useSession();
  const { batches } = useBatches();

  const [selLevel, setSelLevel] = useState("");
  const [selSemester, setSelSemester] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const batchId = session?.user?.batchId;
  const batch = batches.find((b) => b._id === batchId);

  const levels =
    batch?.programme === "BSc" ? [1, 2] : batch?.programme === "BCS" ? [1] : [];
  const semesterNumber =
    selLevel && selSemester
      ? (Number(selLevel) - 1) * 2 + Number(selSemester)
      : null;

  useEffect(() => {
    if (!selLevel && levels.length > 0) {
      setSelLevel(String(levels[0]));
      setSelSemester("1");
    }
  }, [levels, selLevel]);

  useEffect(() => {
    if (!batchId || !semesterNumber) return;
    setLoading(true);
    setError("");

    fetch(
      `/api/subject-assignments?batchId=${batchId}&semesterNumber=${semesterNumber}`,
      {
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAssignments(data.assignments || []);
        } else {
          setAssignments([]);
          setError(data.message || "Failed to load courses");
        }
      })
      .catch(() => {
        setAssignments([]);
        setError("Failed to load courses");
      })
      .finally(() => setLoading(false));
  }, [batchId, semesterNumber]);

  const batchName = batch?.name || "My batch";
  const subtitle = batch
    ? `${batch.name} · ${batch.programme}`
    : "Batch courses and schedule";

  return (
    <div>
      <TopHeader title="My Courses" subtitle={subtitle} />

      <div className="px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <select
            value={selLevel}
            onChange={(e) => {
              setSelLevel(e.target.value);
              setSelSemester("");
            }}
            disabled={!levels.length}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          >
            <option value="">— Select level —</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                Level {level}
              </option>
            ))}
          </select>

          <select
            value={selSemester}
            onChange={(e) => setSelSemester(e.target.value)}
            disabled={!selLevel}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          >
            <option value="">— Select semester —</option>
            {SEMESTER_OPTIONS.map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>

          {batch && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {batch.name}
            </span>
          )}
        </div>

        {!batch ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📚</p>
            <p className="text-sm text-gray-400">
              No batch assigned to your account yet.
            </p>
          </div>
        ) : !selLevel || !selSemester ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📚</p>
            <p className="text-sm text-gray-400">
              Select a level and semester to see your batch courses.
            </p>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-400">Loading courses...</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-sm text-gray-500">
                Showing courses for Level {selLevel}, Semester {selSemester}
              </p>
              <p className="text-sm text-gray-400">
                {assignments.length} course{assignments.length === 1 ? "" : "s"}{" "}
                assigned to your batch.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">
                {error}
              </div>
            )}

            {assignments.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <p className="text-3xl mb-3">📘</p>
                <p className="text-sm text-gray-400">
                  No courses assigned for this semester yet.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Credits</th>
                      <th className="px-5 py-3">Lecturer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr
                        key={assignment._id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-mono text-blue-700">
                          {assignment.subjectId?.code}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {assignment.subjectId?.name}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 capitalize">
                          {assignment.subjectId?.type || "N/A"}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {assignment.subjectId?.credits || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {assignment.lecturerId?.name || "Not assigned yet"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
