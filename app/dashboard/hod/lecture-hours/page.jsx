"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useBatches } from "@/hooks/useBatches";
import { useAssignments } from "@/hooks/useAssignments";
import TopHeader from "@/components/TopHeader";
import LecturerListTab from "@/components/LecturerListTab";

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

const ROLE_COLORS = {
  lecturer: "bg-green-100 text-green-700",
  visiting_lecturer: "bg-orange-100 text-orange-700",
  hod: "bg-purple-100 text-purple-700",
  coordinator: "bg-blue-100 text-blue-700",
  student: "bg-gray-100 text-gray-600",
};
const ROLE_LABELS = {
  lecturer: "Permanent",
  visiting_lecturer: "Visiting",
  hod: "HOD",
  coordinator: "Coordinator",
  student: "Student",
};

function toDateKey(d) {
  return new Date(d).toISOString().split("T")[0];
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// BSc programmes run 4 semesters in this system, BCS runs 2 — same rule used on the Batches page
function getSemesterCount(programme) {
  if (programme === "BSc") return 4;
  if (programme === "BCS") return 2;
  return 8;
}

function getVisibleSemesters(batch) {
  if (!batch) return [];
  const slots = getSemesterCount(batch.programme);
  const existing = batch.semesters || [];
  return Array.from({ length: slots }, (_, idx) => {
    const found = existing.find((s) => s.semesterNumber === idx + 1);
    return found || { semesterNumber: idx + 1, status: "planned" };
  });
}

function MiniCalendar({ selectedDate, onSelect, logDates }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));

  const firstDay = startOfMonth(viewMonth);
  const totalDays = daysInMonth(viewMonth);
  const startOffset = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(delta) {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1),
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => changeMonth(-1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
        >
          ‹
        </button>
        <p className="text-sm font-medium text-gray-800">{monthLabel}</p>
        <button
          onClick={() => changeMonth(1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-xs text-gray-400 font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const cellDate = new Date(
            viewMonth.getFullYear(),
            viewMonth.getMonth(),
            day,
          );
          const key = toDateKey(cellDate);
          const isSelected = toDateKey(selectedDate) === key;
          const isToday = toDateKey(new Date()) === key;
          const hasLogs = logDates.has(key);

          return (
            <button
              key={idx}
              onClick={() => onSelect(cellDate)}
              className={`relative h-9 rounded-lg text-sm transition-colors
                ${
                  isSelected
                    ? "bg-blue-900 text-white font-medium"
                    : isToday
                      ? "bg-blue-50 text-blue-900 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {day}
              {hasLogs && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LogForm({ selectedDate, batches, onSaved }) {
  const [batchId, setBatchId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");
  const [form, setForm] = useState({
    subjectAssignmentId: "",
    startTime: "",
    endTime: "",
    taughtBy: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selBatchObj = batches.find((b) => b._id === batchId);
  const semesterList = getVisibleSemesters(selBatchObj);

  const { assignments } = useAssignments(
    batchId,
    semesterNumber ? Number(semesterNumber) : null,
  );

  const selectedAssignment = assignments.find(
    (a) => a._id === form.subjectAssignmentId,
  );

  useEffect(() => {
    if (selectedAssignment?.lecturerId?._id) {
      setForm((p) => ({ ...p, taughtBy: selectedAssignment.lecturerId._id }));
    } else {
      setForm((p) => ({ ...p, taughtBy: "" }));
    }
  }, [form.subjectAssignmentId]);

  function handleFormChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !batchId ||
      !semesterNumber ||
      !form.subjectAssignmentId ||
      !form.startTime ||
      !form.endTime ||
      !form.taughtBy
    ) {
      setError(
        "Please fill in batch, semester, subject, times, and who taught the class",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lecture-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectAssignmentId: form.subjectAssignmentId,
          batchId,
          semesterNumber: Number(semesterNumber),
          date: toDateKey(selectedDate),
          startTime: form.startTime,
          endTime: form.endTime,
          taughtBy: form.taughtBy,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        return;
      }

      setForm({
        subjectAssignmentId: "",
        startTime: "",
        endTime: "",
        taughtBy: "",
        notes: "",
      });
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-100 rounded-xl p-5 space-y-4"
    >
      <p className="text-sm font-semibold text-gray-700">
        Log a lecture for{" "}
        {selectedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Batch</label>
          <select
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setSemesterNumber("");
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">— Select —</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.programme})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Semester{" "}
            {selBatchObj && (
              <span className="text-gray-300">
                (
                {selBatchObj.programme === "BSc"
                  ? "4 total"
                  : selBatchObj.programme === "BCS"
                    ? "2 total"
                    : ""}
                )
              </span>
            )}
          </label>
          <select
            value={semesterNumber}
            onChange={(e) => setSemesterNumber(e.target.value)}
            disabled={!batchId}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50"
          >
            <option value="">— Select —</option>
            {semesterList.map((s) => (
              <option key={s.semesterNumber} value={s.semesterNumber}>
                Semester {s.semesterNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Subject</label>
        <select
          name="subjectAssignmentId"
          value={form.subjectAssignmentId}
          onChange={handleFormChange}
          disabled={!semesterNumber}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50"
        >
          <option value="">— Select subject —</option>
          {assignments.map((a) => (
            <option key={a._id} value={a._id}>
              {a.subjectId?.code} — {a.subjectId?.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">
          Who taught this class?
        </label>
        {selectedAssignment ? (
          selectedAssignment.lecturerId ? (
            <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 flex items-center justify-between">
              <span>{selectedAssignment.lecturerId.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[selectedAssignment.lecturerId.role]}`}
              >
                {ROLE_LABELS[selectedAssignment.lecturerId.role] ||
                  selectedAssignment.lecturerId.role}
              </span>
            </div>
          ) : (
            <div className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm text-amber-700">
              No lecturer assigned to this subject yet — ask a coordinator to
              assign one before logging hours
            </div>
          )
        ) : (
          <div className="border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400">
            Select a subject first
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Start time</label>
          <select
            name="startTime"
            value={form.startTime}
            onChange={handleFormChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">—</option>
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">End time</label>
          <select
            name="endTime"
            value={form.endTime}
            onChange={handleFormChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">—</option>
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">
          Notes <span className="text-gray-300">(optional)</span>
        </label>
        <input
          name="notes"
          value={form.notes}
          onChange={handleFormChange}
          placeholder="e.g. covered chapter 4, makeup class"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg">
          Lecture logged successfully
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedAssignment?.lecturerId}
        className="w-full bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Log this lecture"}
      </button>
    </form>
  );
}

function LogTab({ batches }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allLogs, setAllLogs] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);

  async function fetchAllLogs() {
    setLoadingAll(true);
    const res = await fetch("/api/lecture-logs");
    const data = await res.json();
    if (data.success) setAllLogs(data.logs);
    setLoadingAll(false);
  }

  useEffect(() => {
    fetchAllLogs();
  }, []);

  const logDates = useMemo(() => {
    const set = new Set();
    allLogs.forEach((l) => set.add(toDateKey(l.date)));
    return set;
  }, [allLogs]);

  const dayLogs = useMemo(() => {
    const key = toDateKey(selectedDate);
    return allLogs.filter((l) => toDateKey(l.date) === key);
  }, [allLogs, selectedDate]);

  const dayTotalHours = dayLogs.reduce((sum, l) => sum + l.durationHours, 0);

  async function handleDeleteLog(id) {
    if (!confirm("Delete this lecture log entry?")) return;
    try {
      const res = await fetch(`/api/lecture-logs/${id}`, { method: "DELETE" });
      let data = null;
      try {
        data = await res.json();
      } catch {
        /* response had no body */
      }

      if (!res.ok || !data?.success) {
        console.error("Delete failed", { status: res.status, data });
        alert(
          data?.message ||
            `Failed to delete (status ${res.status}). Check console for details.`,
        );
        return;
      }
      fetchAllLogs();
    } catch (err) {
      console.error("Delete request error", err);
      alert("Could not reach the server. Please try again.");
    }
  }

  return (
    <div className="grid grid-cols-[280px_1fr_340px] gap-5">
      <div>
        <MiniCalendar
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          logDates={logDates}
        />
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Day has logged lectures
        </div>
      </div>

      <div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-medium">
              {dayTotalHours.toFixed(1)} hrs logged
            </span>
          </div>

          {loadingAll ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : dayLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">
                No lectures logged for this day yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayLogs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">
                        {log.subjectAssignmentId?.subjectId?.code}
                      </span>
                      <span className="text-xs text-gray-400">
                        {log.subjectAssignmentId?.subjectId?.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {log.batchId?.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        Sem {log.semesterNumber}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {log.startTime} – {log.endTime} &nbsp;·&nbsp;{" "}
                      {log.durationHours} hrs
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Taught by{" "}
                      <span className="text-gray-600 font-medium">
                        {log.taughtBy?.name}
                      </span>
                      <span
                        className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[log.taughtBy?.role]}`}
                      >
                        {ROLE_LABELS[log.taughtBy?.role] || log.taughtBy?.role}
                      </span>
                      {log.loggedBy?._id !== log.taughtBy?._id && (
                        <span className="text-gray-400">
                          {" "}
                          &nbsp;·&nbsp; logged by {log.loggedBy?.name}
                        </span>
                      )}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log._id)}
                    className="text-xs text-red-400 hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 leading-relaxed">
          Anyone can log a lecture session — students, lecturers, coordinators,
          and the HOD. Entries count immediately and feed into subject hour
          totals and visiting lecturer payment calculations. Double-check the
          subject, date, time and lecturer before saving.
        </div>
      </div>

      <div>
        <LogForm
          selectedDate={selectedDate}
          batches={batches}
          onSaved={fetchAllLogs}
        />
      </div>
    </div>
  );
}

function SummaryTab({ batches }) {
  const [batchId, setBatchId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");
  const [byLecturer, setByLecturer] = useState([]);
  const [bySubject, setBySubject] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("lecturer");

  const selBatchObj = batches.find((b) => b._id === batchId);
  const semesterList = getVisibleSemesters(selBatchObj);

  async function fetchSummary() {
    if (!batchId || !semesterNumber) return;
    setLoading(true);
    const res = await fetch(
      `/api/lecture-logs/summary?batchId=${batchId}&semesterNumber=${semesterNumber}`,
    );
    const data = await res.json();
    if (data.success) {
      setByLecturer(data.byLecturer);
      setBySubject(data.bySubject);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSummary();
  }, [batchId, semesterNumber]);

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Batch</label>
          <select
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setSemesterNumber("");
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">— Select batch —</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.programme})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Semester</label>
          <select
            value={semesterNumber}
            onChange={(e) => setSemesterNumber(e.target.value)}
            disabled={!batchId}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50"
          >
            <option value="">— Select semester —</option>
            {semesterList.map((s) => (
              <option key={s.semesterNumber} value={s.semesterNumber}>
                Semester {s.semesterNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!batchId || !semesterNumber ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400">
            Select a batch and semester to view hour totals
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-5 bg-blue-50/60 border border-blue-100 rounded-xl p-1.5 w-fit">
            <button
              onClick={() => setView("lecturer")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${view === "lecturer" ? "bg-blue-900 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}
            >
              By lecturer
            </button>
            <button
              onClick={() => setView("subject")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${view === "subject" ? "bg-blue-900 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}
            >
              By subject
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading totals...</p>
          ) : view === "lecturer" ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Lecturer
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Type
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Sessions
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Total hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byLecturer.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-gray-400"
                      >
                        No lecture hours logged yet for this semester
                      </td>
                    </tr>
                  ) : (
                    byLecturer.map((row) => (
                      <tr
                        key={row.lecturerId}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {row.name}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[row.role]}`}
                          >
                            {ROLE_LABELS[row.role] || row.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {row.sessionCount}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-800">
                          {row.totalHours.toFixed(1)} hrs
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Subject
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Credits
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Assigned to
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Sessions
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                      Total hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bySubject.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-400"
                      >
                        No lecture hours logged yet for this semester
                      </td>
                    </tr>
                  ) : (
                    bySubject.map((row) => (
                      <tr
                        key={row.subjectAssignmentId}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono font-medium text-gray-800">
                            {row.subjectCode}
                          </span>
                          <span className="text-gray-400 ml-2">
                            {row.subjectName}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {row.credits}
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {row.assignedLecturer || "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {row.sessionCount}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-800">
                          {row.totalHours.toFixed(1)} hrs
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LectureHoursPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { batches } = useBatches();
  const tab = searchParams?.get("tab") || "log";

  return (
    <div>
      <TopHeader
        title="Lecture hours"
        subtitle="Log class sessions and review total teaching hours by subject and lecturer"
      />

      <div className="px-8 py-6">
        <div className="flex gap-1 mb-6 border-b border-gray-100">
          <button
            onClick={() => router.push(`${pathname}?tab=log`)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px rounded-t-xl transition-all
              ${
                tab === "log"
                  ? "border-blue-900 bg-blue-900 text-white font-medium"
                  : "border-transparent bg-white text-gray-500 hover:text-gray-700"
              }`}
          >
            Log lectures
          </button>
          <button
            onClick={() => router.push(`${pathname}?tab=summary`)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px rounded-t-xl transition-all
              ${
                tab === "summary"
                  ? "border-blue-900 bg-blue-900 text-white font-medium"
                  : "border-transparent bg-white text-gray-500 hover:text-gray-700"
              }`}
          >
            Hours summary
          </button>
          <button
            onClick={() => router.push(`${pathname}?tab=reports`)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px rounded-t-xl transition-all
              ${
                tab === "reports"
                  ? "border-blue-900 bg-blue-900 text-white font-medium"
                  : "border-transparent bg-white text-gray-500 hover:text-gray-700"
              }`}
          >
            Lecturer reports
          </button>
        </div>

        {tab === "log" ? (
          <LogTab batches={batches} />
        ) : tab === "summary" ? (
          <SummaryTab batches={batches} />
        ) : (
          <LecturerListTab />
        )}
      </div>
    </div>
  );
}
