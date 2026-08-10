"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBatches } from "@/hooks/useBatches";
import TopHeader from "@/components/TopHeader";

const TIMES = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const SEMESTER_OPTIONS = [1, 2];

export default function StudentLectureHoursPage() {
  const { data: session, status } = useSession();
  const { batches } = useBatches();

  const [selLevel, setSelLevel] = useState("");
  const [selSemester, setSelSemester] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subjectAssignmentId, setSubjectAssignmentId] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    Promise.all([
      fetch(
        `/api/subject-assignments?batchId=${batchId}&semesterNumber=${semesterNumber}`,
        {
          credentials: "include",
        },
      ).then((res) => res.json()),
      fetch(
        `/api/lecture-logs?batchId=${batchId}&semesterNumber=${semesterNumber}`,
        {
          credentials: "include",
        },
      ).then((res) => res.json()),
    ])
      .then(([assignData, logData]) => {
        setAssignments(assignData.success ? assignData.assignments || [] : []);
        setLogs(logData.success ? logData.logs || [] : []);
        if (!assignData.success || !logData.success) {
          setError("Unable to load lecture hours or course data");
        }
      })
      .catch(() => {
        setAssignments([]);
        setLogs([]);
        setError("Unable to load lecture hours or course data");
      })
      .finally(() => setLoading(false));
  }, [batchId, semesterNumber]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (
      !batchId ||
      !semesterNumber ||
      !subjectAssignmentId ||
      !date ||
      !startTime ||
      !endTime
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/lecture-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectAssignmentId,
          batchId,
          semesterNumber,
          date,
          startTime,
          endTime,
          taughtBy: session.user.id,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Unable to log lecture hours.");
      } else {
        setSuccess("Lecture hours logged successfully.");
        setNotes("");
        setSubjectAssignmentId("");
        setStartTime("08:00");
        setEndTime("09:00");
        setTimeout(() => setSuccess(""), 3000);
        setLogs((prev) => [data.log, ...prev]);
      }
    } catch {
      setError("Unable to log lecture hours.");
    } finally {
      setSaving(false);
    }
  }

  const subtitle = batch
    ? `${batch.name} · ${batch.programme}`
    : "Log your lecture hours";

  return (
    <div>
      <TopHeader title="Lecture Hours" subtitle={subtitle} />

      <div className="px-8 py-6 space-y-6">
        {!batch ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">🕐</p>
            <p className="text-sm text-gray-400">
              No batch assigned to your account yet.
            </p>
          </div>
        ) : !selLevel || !selSemester ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">🕐</p>
            <p className="text-sm text-gray-400">
              Select a level and semester to log lecture hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex flex-wrap gap-3 mb-5 items-center">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="text-base font-semibold text-gray-900">
                    {batch.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="text-base font-semibold text-gray-900">
                    Level {selLevel}, Semester {selSemester}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select
                  value={selLevel}
                  onChange={(e) => {
                    setSelLevel(e.target.value);
                    setSelSemester("");
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">— Select semester —</option>
                  {SEMESTER_OPTIONS.map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">
                  Loading subjects and logs…
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700">
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <label className="block text-sm text-gray-600">
                      Subject
                      <select
                        value={subjectAssignmentId}
                        onChange={(e) => setSubjectAssignmentId(e.target.value)}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="">— Select subject —</option>
                        {assignments.map((assignment) => (
                          <option key={assignment._id} value={assignment._id}>
                            {assignment.subjectId?.code} —{" "}
                            {assignment.subjectId?.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block text-sm text-gray-600">
                        Date
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block text-sm text-gray-600">
                          Start
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          >
                            {TIMES.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm text-gray-600">
                          End
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          >
                            {TIMES.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <label className="block text-sm text-gray-600">
                      Notes (optional)
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="Add details about the lecture..."
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving ? "Logging…" : "Log lecture hours"}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Recent logs
                  </h2>
                  <p className="text-xs text-gray-400">
                    Your submitted lecture entries for this semester.
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {logs.length} entries
                </span>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Loading logs…</p>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                  No lecture hours logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mb-2">
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                        <span>
                          {log.startTime} — {log.endTime}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {log.subjectAssignmentId?.subjectId?.code || "Course"} —{" "}
                        {log.subjectAssignmentId?.subjectId?.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Logged by {session.user.name}
                      </p>
                      {log.notes && (
                        <p className="text-sm text-gray-500 mt-2">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
