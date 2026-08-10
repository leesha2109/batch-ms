"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBatches } from "@/hooks/useBatches";
import { useAssignments } from "@/hooks/useAssignments";
import TopHeader from "@/components/TopHeader";
import ExamTimetableModal from "@/components/ExamTimetableModal";

const SEMESTER_OPTIONS = [1, 2];
const AUTHORIZED_ROLES = ["hod", "coordinator"];

function EditableCell({ value, onChange, placeholder, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value || "");

  function handleBlur() {
    setEditing(false);
    onChange(local);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleBlur();
        }}
        placeholder={placeholder}
        className="w-full border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setLocal(value || "");
        setEditing(true);
      }}
      className="text-left w-full group"
    >
      {value ? (
        <span className="text-sm text-blue-800">{value}</span>
      ) : (
        <span className="text-sm text-blue-300 group-hover:text-blue-500">
          {placeholder} ✎
        </span>
      )}
    </button>
  );
}

function StatusSelect({ value, onChange, options, colors }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900 ${colors[value] || colors.default}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ExamsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManageTimetable = AUTHORIZED_ROLES.includes(userRole);
  const isStudent = userRole === "student";

  const { batches } = useBatches();
  const [tab, setTab] = useState("paper_settings");
  const [selBatch, setSelBatch] = useState("");
  const [selLevel, setSelLevel] = useState("");
  const [selSemester, setSelSemester] = useState("");
  const [busy, setBusy] = useState(null);
  const [paperSettings, setPaperSettings] = useState({});
  const [paperMarkings, setPaperMarkings] = useState({});
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const selBatchObj = batches.find((b) => b._id === selBatch);
  const levels =
    selBatchObj?.programme === "BSc"
      ? [1, 2]
      : selBatchObj?.programme === "BCS"
        ? [1]
        : [];
  const semesterNumber =
    selLevel && selSemester
      ? (Number(selLevel) - 1) * 2 + Number(selSemester)
      : null;
  const { assignments, refetch } = useAssignments(selBatch, semesterNumber);

  const PAPER_STATUS_OPTS = [
    { value: "pending", label: "Pending" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
  ];
  const PAPER_STATUS_COLORS = {
    pending: "bg-amber-100 text-amber-700",
    submitted: "bg-blue-100  text-blue-700",
    approved: "bg-green-100 text-green-700",
    default: "bg-amber-100 text-amber-700",
  };
  const MODERATE_STATUS_OPTS = [
    { value: "pending", label: "Pending" },
    { value: "moderated", label: "Moderated" },
  ];
  const MODERATE_STATUS_COLORS = {
    pending: "bg-amber-100 text-amber-700",
    moderated: "bg-green-100 text-green-700",
    default: "bg-amber-100 text-amber-700",
  };
  const MARKING_STATUS_OPTS = [
    { value: "not_finished", label: "Not Finished" },
    { value: "finished", label: "Finished" },
  ];
  const MARKING_STATUS_COLORS = {
    not_finished: "bg-amber-100 text-amber-700",
    finished: "bg-green-100 text-green-700",
    default: "bg-amber-100 text-amber-700",
  };
  const EXAM_TYPE_LABELS = {
    theory: "Theory",
    practical: "Practical",
  };

  const showTable = selBatch && selLevel && selSemester;

  async function patchAssignment(id, body) {
    setBusy(id);
    try {
      const res = await fetch(`/api/subject-assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to save changes");
      refetch();
    } catch (error) {
      console.error("Failed to save assignment update:", error);
      alert(error.message);
    } finally {
      setBusy(null);
    }
  }

  function updatePaperSetting(id, field, value) {
    setPaperSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    patchAssignment(id, { paperSetting: { [field]: value } });
  }

  function updatePaperMarking(id, field, value) {
    setPaperMarkings((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    patchAssignment(id, { paperMarking: { [field]: value } });
  }

  function getPaperSetting(id) {
    return paperSettings[id] || {};
  }

  function getPaperMarking(id) {
    return paperMarkings[id] || {};
  }

  const psVal = (a, field) =>
    getPaperSetting(a._id)[field] ?? a.paperSetting?.[field] ?? "";
  const pmVal = (a, field) =>
    getPaperMarking(a._id)[field] ?? a.paperMarking?.[field] ?? "";

  const loadTimetable = useCallback(async () => {
    if (!selBatch || !semesterNumber) return;
    setLoadingTimetable(true);
    try {
      const res = await fetch(
        `/api/exam-timetable?batch=${selBatch}&semester=${semesterNumber}`,
      );
      const data = await res.json();
      if (res.ok) setTimetableEntries(data.entries || []);
    } catch (err) {
      console.error("Failed to load exam timetable", err);
    } finally {
      setLoadingTimetable(false);
    }
  }, [selBatch, semesterNumber]);

  const loadComments = useCallback(async () => {
    if (!selBatch || !semesterNumber) return;
    setLoadingComments(true);
    try {
      const res = await fetch(
        `/api/exam-timetable/comments?batch=${selBatch}&semester=${semesterNumber}`,
      );
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoadingComments(false);
    }
  }, [selBatch, semesterNumber]);

  useEffect(() => {
    if (tab === "exam_timetable" && selBatch && semesterNumber) {
      loadTimetable();
      loadComments();
    }
  }, [tab, selBatch, semesterNumber, loadTimetable, loadComments]);

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch("/api/exam-timetable/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: selBatch,
          semester: semesterNumber,
          message: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText("");
        loadComments();
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteEntry(id) {
    if (!confirm("Delete this exam timetable entry?")) return;
    try {
      const res = await fetch(`/api/exam-timetable/${id}`, {
        method: "DELETE",
      });
      if (res.ok) loadTimetable();
      else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Failed to delete entry", err);
    }
  }

  return (
    <div>
      <TopHeader
        title="Exams"
        subtitle="Manage paper settings, marking and exam timetable"
      />

      <div className="px-8 py-6">
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <select
            value={selBatch}
            onChange={(e) => {
              setSelBatch(e.target.value);
              setSelLevel("");
              setSelSemester("");
            }}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">— Select batch —</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selLevel}
            onChange={(e) => {
              setSelLevel(e.target.value);
              setSelSemester("");
            }}
            disabled={!selBatch}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50"
          >
            <option value="">— Select level —</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>

          <select
            value={selSemester}
            onChange={(e) => setSelSemester(e.target.value)}
            disabled={!selLevel}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50"
          >
            <option value="">— Select semester —</option>
            {SEMESTER_OPTIONS.map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-0 border-b border-blue-100 mb-6">
          {[
            { key: "paper_settings", label: "Paper Settings" },
            { key: "paper_marking", label: "Paper Marking" },
            { key: "exam_timetable", label: "Exam Timetable" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm border-b-2 -mb-px transition-colors ${tab === t.key ? "border-blue-900 text-blue-900 font-medium" : "border-transparent text-blue-400 hover:text-blue-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!showTable ? (
          <div className="bg-white border border-dashed border-blue-200 rounded-xl p-10 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-blue-400">
              Select a batch, level and semester to view exams
            </p>
          </div>
        ) : tab === "paper_settings" ? (
          <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50">
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Subject
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Lecturer
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Paper Setting Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Moderator Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Moderator Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Moderate Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-blue-400"
                    >
                      No subjects assigned to this semester yet
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr
                      key={a._id}
                      className={`border-b border-blue-50 hover:bg-blue-50 ${busy === a._id ? "opacity-60" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <p className="text-xs font-mono text-blue-400">
                          {a.subjectId?.code}
                        </p>
                        <p className="text-sm font-medium text-blue-800">
                          {a.subjectId?.name}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-blue-600 text-sm">
                        {a.lecturerId?.name || (
                          <span className="text-amber-500 text-xs">
                            ⚠ Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={psVal(a, "status") || "pending"}
                          onChange={(v) =>
                            updatePaperSetting(a._id, "status", v)
                          }
                          options={PAPER_STATUS_OPTS}
                          colors={PAPER_STATUS_COLORS}
                        />
                      </td>
                      <td className="px-5 py-3 min-w-40">
                        <EditableCell
                          value={psVal(a, "moderatorName")}
                          onChange={(v) =>
                            updatePaperSetting(a._id, "moderatorName", v)
                          }
                          placeholder="Add moderator"
                        />
                      </td>
                      <td className="px-5 py-3 min-w-45">
                        <EditableCell
                          value={psVal(a, "moderatorEmail")}
                          onChange={(v) =>
                            updatePaperSetting(a._id, "moderatorEmail", v)
                          }
                          placeholder="Add email"
                          type="email"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={psVal(a, "moderateStatus") || "pending"}
                          onChange={(v) =>
                            updatePaperSetting(a._id, "moderateStatus", v)
                          }
                          options={MODERATE_STATUS_OPTS}
                          colors={MODERATE_STATUS_COLORS}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : tab === "paper_marking" ? (
          <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50">
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Subject
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    First Marker (Lecturer)
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    First Marking Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Second Marker
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Second Marker Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                    Second Marking Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-blue-400"
                    >
                      No subjects assigned to this semester yet
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr
                      key={a._id}
                      className={`border-b border-blue-50 hover:bg-blue-50 ${busy === a._id ? "opacity-60" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <p className="text-xs font-mono text-blue-400">
                          {a.subjectId?.code}
                        </p>
                        <p className="text-sm font-medium text-blue-800">
                          {a.subjectId?.name}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-blue-700">
                          {a.lecturerId?.name || (
                            <span className="text-amber-500 text-xs">
                              ⚠ Not assigned
                            </span>
                          )}
                        </p>
                        {a.lecturerId?.email && (
                          <p className="text-xs text-blue-400">
                            {a.lecturerId.email}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={
                            pmVal(a, "firstMarkingStatus") || "not_finished"
                          }
                          onChange={(v) =>
                            updatePaperMarking(a._id, "firstMarkingStatus", v)
                          }
                          options={MARKING_STATUS_OPTS}
                          colors={MARKING_STATUS_COLORS}
                        />
                      </td>
                      <td className="px-5 py-3 min-w-40">
                        <EditableCell
                          value={pmVal(a, "secondMarkerName")}
                          onChange={(v) =>
                            updatePaperMarking(a._id, "secondMarkerName", v)
                          }
                          placeholder="Add second marker"
                        />
                      </td>
                      <td className="px-5 py-3 min-w-45">
                        <EditableCell
                          value={pmVal(a, "secondMarkerEmail")}
                          onChange={(v) =>
                            updatePaperMarking(a._id, "secondMarkerEmail", v)
                          }
                          placeholder="Add email"
                          type="email"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={
                            pmVal(a, "secondMarkingStatus") || "not_finished"
                          }
                          onChange={(v) =>
                            updatePaperMarking(a._id, "secondMarkingStatus", v)
                          }
                          options={MARKING_STATUS_OPTS}
                          colors={MARKING_STATUS_COLORS}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-blue-100 bg-blue-50">
                <p className="text-xs text-blue-400 font-medium">
                  Exam schedule for the selected batch and semester
                </p>
                {canManageTimetable && (
                  <button
                    onClick={() => {
                      setEditingEntry(null);
                      setShowTimetableModal(true);
                    }}
                    className="text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 px-3 py-1.5 rounded-lg"
                  >
                    + Add Exam
                  </button>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-100">
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                      Subject
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                      Date
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                      Time
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                      Venue
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                      Type
                    </th>
                    {canManageTimetable && (
                      <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium"></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loadingTimetable ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-blue-400"
                      >
                        Loading timetable...
                      </td>
                    </tr>
                  ) : timetableEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-blue-400"
                      >
                        No exam timetable published yet for this semester
                      </td>
                    </tr>
                  ) : (
                    timetableEntries.map((entry) => (
                      <tr
                        key={entry._id}
                        className="border-b border-blue-50 hover:bg-blue-50"
                      >
                        <td className="px-5 py-3">
                          <p className="text-xs font-mono text-blue-400">
                            {entry.subject?.code}
                          </p>
                          <p className="text-sm font-medium text-blue-800">
                            {entry.subject?.name}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-blue-700">
                          {new Date(entry.examDate).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </td>
                        <td className="px-5 py-3 text-blue-700">
                          {entry.startTime} – {entry.endTime}
                        </td>
                        <td className="px-5 py-3 text-blue-700">
                          {entry.venue || "-"}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                            {EXAM_TYPE_LABELS[entry.examType] || entry.examType}
                          </span>
                        </td>
                        {canManageTimetable && (
                          <td className="px-5 py-3">
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setShowTimetableModal(true);
                                }}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="text-xs font-medium text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-xl border border-blue-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-blue-800">
                  Student Feedback
                </h3>
                <span className="text-[11px] text-blue-300">
                  Comments auto-clear after 24h
                </span>
              </div>
              <p className="text-xs text-blue-400 mb-4">
                Students can flag clashes, venue issues, or ask questions about
                this exam schedule.
              </p>
              {isStudent && (
                <div className="flex gap-2 mb-5">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePostComment();
                    }}
                    placeholder="Add feedback about this exam timetable..."
                    maxLength={500}
                    className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={postingComment || !commentText.trim()}
                    className="text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {postingComment ? "Posting..." : "Post"}
                  </button>
                </div>
              )}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loadingComments ? (
                  <p className="text-sm text-blue-400">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-blue-300">No feedback yet.</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c._id}
                      className="flex gap-3 border-b border-blue-50 pb-3 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                        {c.studentName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-blue-800">
                            {c.studentName}
                          </p>
                          <p className="text-[11px] text-blue-300">
                            {timeAgo(c.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-blue-700 mt-0.5">
                          {c.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showTimetableModal && (
        <ExamTimetableModal
          entry={editingEntry}
          batchId={selBatch}
          semester={semesterNumber}
          assignments={assignments}
          onClose={() => {
            setShowTimetableModal(false);
            setEditingEntry(null);
          }}
          onSaved={() => {
            setShowTimetableModal(false);
            setEditingEntry(null);
            loadTimetable();
          }}
        />
      )}
    </div>
  );
}
