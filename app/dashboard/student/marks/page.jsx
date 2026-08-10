"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBatches } from "@/hooks/useBatches";
import { useAssignments } from "@/hooks/useAssignments";
import TopHeader from "@/components/TopHeader";

const SEMESTER_OPTIONS = [1, 2];

export default function StudentMarksPage() {
  const { data: session, status } = useSession();
  const { batches } = useBatches();

  const [selLevel, setSelLevel] = useState("");
  const [selSemester, setSelSemester] = useState("");

  const batchId = session?.user?.batchId;
  const batch = batches.find((b) => b._id === batchId);
  const levels =
    batch?.programme === "BSc" ? [1, 2] : batch?.programme === "BCS" ? [1] : [];
  const semesterNumber =
    selLevel && selSemester
      ? (Number(selLevel) - 1) * 2 + Number(selSemester)
      : null;
  const { assignments, loading } = useAssignments(batchId, semesterNumber);

  useEffect(() => {
    if (!selLevel && levels.length > 0) {
      setSelLevel(String(levels[0]));
      setSelSemester("1");
    }
  }, [levels, selLevel]);

  const examHeldCount = assignments.filter((a) => a.examHeld).length;
  const resultsReleasedCount = assignments.filter(
    (a) => a.resultsReleased,
  ).length;

  return (
    <div>
      <TopHeader
        title="Results Status"
        subtitle={
          batch
            ? `${batch.name} · ${batch.programme}`
            : "Exam and result release status"
        }
      />

      <div className="px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
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
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm text-gray-400">
              No batch assigned to your account yet.
            </p>
          </div>
        ) : !selLevel || !selSemester ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm text-gray-400">
              Select a level and semester to view results status.
            </p>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-400">Loading results...</p>
        ) : assignments.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">🔎</p>
            <p className="text-sm text-gray-400">
              No subjects have been assigned for this semester yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[180px] rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-sm text-gray-500">Exams held</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {examHeldCount}
                </p>
              </div>
              <div className="flex-1 min-w-[180px] rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-sm text-gray-500">Results released</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {resultsReleasedCount}
                </p>
              </div>
              <div className="flex-1 min-w-[180px] rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-sm text-gray-500">Total courses</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {assignments.length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">Lecturer</th>
                    <th className="px-5 py-3">Exam status</th>
                    <th className="px-5 py-3">Results status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const examHeld = !!assignment.examHeld;
                    const resultsReleased = !!assignment.resultsReleased;
                    return (
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
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {assignment.lecturerId?.name || "Not assigned yet"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${examHeld ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {examHeld ? "Held" : "Pending"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${resultsReleased ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {resultsReleased ? "Released" : "Locked"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
