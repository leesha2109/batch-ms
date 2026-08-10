"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import { useBatches } from "@/hooks/useBatches";
import { useUsers } from "@/hooks/useUsers";

const STATUS_COLORS = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-yellow-100 text-yellow-700",
  evaluated: "bg-green-100 text-green-700",
};
const STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  evaluated: "Evaluated",
};

const EXPECTED_DOCS = [
  { key: "research_proposal", label: "Research Proposal" },
  { key: "interim_report", label: "Interim Report" },
  { key: "manuscript", label: "Manuscript" },
  { key: "final_thesis", label: "Final Thesis" },
];

const MILESTONES = [
  {
    key: "titleConfirmed",
    label: "Confirm project title",
    desc: "Project title finalised and approved",
  },
  {
    key: "proposalSubmitted",
    label: "Submit project proposal",
    desc: "Research proposal submitted to supervisor",
  },
  {
    key: "interimSubmitted",
    label: "Submit interim report",
    desc: "Interim progress report submitted",
  },
  {
    key: "finalSubmitted",
    label: "Final report submission",
    desc: "Final thesis/report submitted for evaluation",
  },
];

const MARK_SHEETS = [
  { key: "proposal", label: "Proposal", max: 10 },
  { key: "interim", label: "Interim Report", max: 10 },
  { key: "finalReport", label: "Thesis (Final Report)", max: 45 },
  { key: "publication", label: "Publication", max: 15 },
  { key: "finalViva", label: "Final Viva", max: 20 },
];

const FINAL_SUMMARY_TAB = { key: "finalSummary", label: "Final Mark Sheet" };
const ALL_MARK_TABS = [...MARK_SHEETS, FINAL_SUMMARY_TAB];

function buildMarkRows(project) {
  const students = project?.students || [];
  if (!students.length) {
    return [
      {
        name: "",
        studentId: "",
        supervisor: project?.supervisorId?.name || "",
        mark: 0,
        m1: 0,
        m2: 0,
        m3: 0,
        m4: 0,
        reportMarks: 0,
      },
    ];
  }
  return students.map((student) => ({
    name: student.name || "",
    studentId: student.studentId || "",
    supervisor: project?.supervisorId?.name || "",
    mark: 0,
    m1: 0,
    m2: 0,
    m3: 0,
    m4: 0,
    reportMarks: 0,
  }));
}

function buildDefaultMarks(project) {
  return {
    proposal: { max: 10, rows: buildMarkRows(project) },
    interim: { max: 10, rows: buildMarkRows(project) },
    finalReport: { max: 45, rows: buildMarkRows(project) },
    publication: { max: 15, rows: buildMarkRows(project) },
    finalViva: { max: 20, rows: buildMarkRows(project) },
  };
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ── shared cell styles ────────────────────────────────────────────────────────
const TD = "px-3 py-3 border border-gray-200 text-sm text-gray-800";
const TH =
  "px-3 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200 bg-gray-50";
const TH_C =
  "px-3 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-gray-50";

function YellowInput({ value, onChange, max = 100 }) {
  return (
    <input
      type="number"
      min="0"
      max={max}
      value={value ?? 0}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 px-1 py-1 text-center text-sm border border-yellow-300 rounded bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-yellow-500"
    />
  );
}

function GreenBadge({ value }) {
  return (
    <span className="inline-block px-3 py-1 rounded bg-green-50 text-green-800 font-semibold text-sm min-w-[3rem] text-center border border-green-200">
      {value !== "" && value !== null && value !== undefined
        ? Number(value).toFixed(2)
        : "—"}
    </span>
  );
}

// ── Project form modal ────────────────────────────────────────────────────────
function ProjectFormModal({ project, courseId, batchId, onClose, onSaved }) {
  const isEditing = !!project?._id;
  const { users: students } = useUsers("student");
  const { users: lecturers } = useUsers("lecturer");

  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    type: project?.type || "individual",
    supervisorId: project?.supervisorId?._id || project?.supervisorId || "",
    students: project?.students?.map((s) => s._id || s) || [],
    status: project?.status || "not_started",
    startDate: project?.startDate ? project.startDate.slice(0, 10) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleStudent(id) {
    setForm((prev) => ({
      ...prev,
      students: prev.students.includes(id)
        ? prev.students.filter((s) => s !== id)
        : [...prev.students, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = isEditing ? `/api/projects/${project._id}` : "/api/projects";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subjectId: courseId, batchId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      if (onSaved) onSaved(data.project);
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold">
            {isEditing ? "Edit project" : "Add new project"}
          </h2>
          <button onClick={onClose} className="text-gray-400 text-xl">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Project title
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              required
              placeholder="e.g. Student Management System"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value, students: [] }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Start date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="evaluated">Evaluated</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Supervisor
              </label>
              <select
                value={form.supervisorId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, supervisorId: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">— Select —</option>
                {lecturers.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {form.type === "group"
                ? "Assign students (multiple)"
                : "Assign student (one)"}
            </label>
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-50">
              {students.length === 0 ? (
                <p className="text-xs text-gray-400 p-3">No students found</p>
              ) : (
                students.map((s) => (
                  <label
                    key={s._id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type={form.type === "individual" ? "radio" : "checkbox"}
                      checked={form.students.includes(s._id)}
                      onChange={() =>
                        form.type === "individual"
                          ? setForm((p) => ({ ...p, students: [s._id] }))
                          : toggleStudent(s._id)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {s.studentId}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Marks panel ───────────────────────────────────────────────────────────────
function ProjectMarksPanel({ project, onProjectUpdated }) {
  const [activeTab, setActiveTab] = useState("proposal");
  const [marksState, setMarksState] = useState(
    project?.marks || buildDefaultMarks(project),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMarksState(project?.marks || buildDefaultMarks(project));
  }, [project]);

  function saveMarks(nextState) {
    setSaving(true);
    fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ marks: nextState }),
    })
      .then(readJsonSafely)
      .then((data) => {
        if (data?.success && data.project && onProjectUpdated)
          onProjectUpdated(data.project);
      })
      .finally(() => setSaving(false));
  }

  function updateMark(sheetKey, rowIndex, value) {
    const max = marksState?.[sheetKey]?.max ?? 100;
    const clean = Math.min(Number(value), max);
    const nextState = {
      ...marksState,
      [sheetKey]: {
        ...(marksState?.[sheetKey] || { max }),
        rows: (marksState?.[sheetKey]?.rows || []).map((row, idx) =>
          idx !== rowIndex
            ? row
            : { ...row, mark: Number.isFinite(clean) ? clean : 0 },
        ),
      },
    };
    setMarksState(nextState);
    saveMarks(nextState);
  }

  function updateProposalRow(rowIndex, field, value) {
    const clean = Number(value);
    const nextRows = (marksState?.proposal?.rows || []).map((row, idx) => {
      if (idx !== rowIndex) return row;
      const updated = {
        ...row,
        [field]: Number.isFinite(clean) ? Math.min(clean, 100) : 0,
      };
      const avg =
        (Number(updated.m1 || 0) +
          Number(updated.m2 || 0) +
          Number(updated.m3 || 0) +
          Number(updated.m4 || 0)) /
        4;
      return {
        ...updated,
        mark: Number(
          Math.min(avg + Number(updated.reportMarks || 0), 10).toFixed(2),
        ),
      };
    });
    const nextState = {
      ...marksState,
      proposal: { ...(marksState?.proposal || { max: 10 }), rows: nextRows },
    };
    setMarksState(nextState);
    saveMarks(nextState);
  }

  // ── UPDATED: finalReport uses M1+M2, average scaled to 45 ──
  function updateFinalReportRow(rowIndex, field, value) {
    const clean = Number(value);
    const nextRows = (marksState?.finalReport?.rows || []).map((row, idx) => {
      if (idx !== rowIndex) return row;
      const updated = {
        ...row,
        [field]: Number.isFinite(clean) ? Math.min(clean, 100) : 0,
      };
      const filled = [updated.m1, updated.m2].filter(
        (v) => v !== "" && v !== undefined && v !== 0,
      ).length;
      const avg =
        filled > 0
          ? (Number(updated.m1 || 0) + Number(updated.m2 || 0)) / filled
          : 0;
      const scaled = Number(((avg / 100) * 45).toFixed(2));
      return { ...updated, mark: scaled };
    });
    const nextState = {
      ...marksState,
      finalReport: {
        ...(marksState?.finalReport || { max: 45 }),
        rows: nextRows,
      },
    };
    setMarksState(nextState);
    saveMarks(nextState);
  }

  function updateFinalVivaRow(rowIndex, field, value) {
    const clean = Number(value);
    const nextRows = (marksState?.finalViva?.rows || []).map((row, idx) => {
      if (idx !== rowIndex) return row;
      const updated = {
        ...row,
        [field]: Number.isFinite(clean) ? Math.min(clean, 100) : 0,
      };
      const avg =
        (Number(updated.m1 || 0) +
          Number(updated.m2 || 0) +
          Number(updated.m3 || 0) +
          Number(updated.m4 || 0)) /
        4;
      return { ...updated, mark: Number(((avg / 100) * 20).toFixed(2)) };
    });
    const nextState = {
      ...marksState,
      finalViva: { ...(marksState?.finalViva || { max: 20 }), rows: nextRows },
    };
    setMarksState(nextState);
    saveMarks(nextState);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-700">Marks</h3>
        <div className="flex gap-2 flex-wrap">
          {ALL_MARK_TABS.map((sheet) => (
            <button
              key={sheet.key}
              type="button"
              onClick={() => setActiveTab(sheet.key)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition
                ${activeTab === sheet.key ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {sheet.label}
            </button>
          ))}
        </div>
        {saving && (
          <span className="text-xs text-blue-600 animate-pulse">Saving…</span>
        )}
      </div>

      {/* ── Thesis (Final Report) — UPDATED structure ── */}
      {activeTab === "finalReport" && (
        <div className="space-y-2">
          <div className="bg-gray-800 text-white text-center py-2 rounded-t-lg font-semibold text-sm">
            Thesis (Final Report) marking sheet
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-b-xl">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Index No</th>
                  <th className={TH}>Project Title</th>
                  <th className={TH}>Supervisor/s</th>
                  <th className={`${TH_C} bg-yellow-50`}>M1</th>
                  <th className={`${TH_C} bg-yellow-50`}>M2</th>
                  <th className={`${TH_C} bg-green-50`}>Average (45%)</th>
                </tr>
              </thead>
              <tbody>
                {(marksState?.finalReport?.rows || []).map((row, rowIndex) => {
                  const m1 = Number(row.m1 || 0);
                  const m2 = Number(row.m2 || 0);
                  const filled = [row.m1, row.m2].filter(
                    (v) => v !== "" && v !== undefined && Number(v) !== 0,
                  ).length;
                  const avg = filled > 0 ? (m1 + m2) / filled : 0;
                  const scaled = Number(((avg / 100) * 45).toFixed(2));
                  return (
                    <tr
                      key={`fr-${rowIndex}`}
                      className={
                        rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      }
                    >
                      <td className={TD}>{row.name || "—"}</td>
                      <td className={`${TD} font-mono text-blue-600`}>
                        {row.studentId || "—"}
                      </td>
                      <td className={TD}>{project?.title || "—"}</td>
                      <td className={TD}>
                        {row.supervisor || project?.supervisorId?.name || "—"}
                      </td>
                      {/* M1 — yellow editable */}
                      <td className="px-2 py-2 border border-gray-200 text-center bg-yellow-50">
                        <YellowInput
                          value={row.m1 || ""}
                          onChange={(v) =>
                            updateFinalReportRow(rowIndex, "m1", v)
                          }
                        />
                      </td>
                      {/* M2 — yellow editable */}
                      <td className="px-2 py-2 border border-gray-200 text-center bg-yellow-50">
                        <YellowInput
                          value={row.m2 || ""}
                          onChange={(v) =>
                            updateFinalReportRow(rowIndex, "m2", v)
                          }
                        />
                      </td>
                      {/* Average (45%) — green calculated */}
                      <td className="px-4 py-2 border border-gray-200 text-center bg-green-50">
                        <GreenBadge value={filled > 0 ? scaled : ""} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Proposal ── */}
      {activeTab === "proposal" && (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Index No</th>
                <th className={TH}>Project Title</th>
                <th className={TH}>Supervisor/s</th>
                <th className={TH_C}>M1</th>
                <th className={TH_C}>M2</th>
                <th className={TH_C}>M3</th>
                <th className={TH_C}>M4</th>
                <th className={TH_C}>Avg PPT (5)</th>
                <th className={TH_C}>Report (5)</th>
                <th className={TH_C}>Total (10)</th>
              </tr>
            </thead>
            <tbody>
              {(marksState?.proposal?.rows || []).map((row, rowIndex) => {
                const avg =
                  (Number(row.m1 || 0) +
                    Number(row.m2 || 0) +
                    Number(row.m3 || 0) +
                    Number(row.m4 || 0)) /
                  4;
                const total = Number(
                  Math.min(avg + Number(row.reportMarks || 0), 10).toFixed(2),
                );
                return (
                  <tr
                    key={`proposal-${rowIndex}`}
                    className={
                      rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }
                  >
                    <td className={TD}>{row.name || "—"}</td>
                    <td className={`${TD} font-mono text-blue-600`}>
                      {row.studentId || "—"}
                    </td>
                    <td className={TD}>{project?.title || "—"}</td>
                    <td className={TD}>
                      {row.supervisor || project?.supervisorId?.name || "—"}
                    </td>
                    {["m1", "m2", "m3", "m4"].map((f) => (
                      <td
                        key={f}
                        className="px-2 py-2 border border-gray-200 text-center bg-yellow-50"
                      >
                        <YellowInput
                          value={row[f] || ""}
                          onChange={(v) => updateProposalRow(rowIndex, f, v)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 border border-gray-200 text-center bg-green-50">
                      <GreenBadge value={avg.toFixed(2)} />
                    </td>
                    <td className="px-2 py-2 border border-gray-200 text-center bg-yellow-50">
                      <YellowInput
                        value={row.reportMarks || ""}
                        max={5}
                        onChange={(v) =>
                          updateProposalRow(rowIndex, "reportMarks", v)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-center bg-green-50">
                      <GreenBadge value={total} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Final Viva ── */}
      {activeTab === "finalViva" && (
        <div className="space-y-2">
          <div className="bg-gray-800 text-white text-center py-2 rounded-t-lg font-semibold text-sm">
            Final Presentation marking sheet
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-b-xl">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Index No</th>
                  <th className={TH}>Project Title</th>
                  <th className={TH}>Supervisor/s</th>
                  <th className={`${TH_C} bg-yellow-50`}>m1</th>
                  <th className={`${TH_C} bg-yellow-50`}>m2</th>
                  <th className={`${TH_C} bg-yellow-50`}>m3</th>
                  <th
                    className={`${TH_C} bg-yellow-100 ring-2 ring-inset ring-green-600`}
                  >
                    m4
                  </th>
                  <th className={`${TH_C} bg-green-50`}>Average</th>
                  <th className={`${TH_C} bg-green-50`}>Total PPT 20%</th>
                </tr>
              </thead>
              <tbody>
                {(marksState?.finalViva?.rows || []).map((row, rowIndex) => {
                  const avg =
                    (Number(row.m1 || 0) +
                      Number(row.m2 || 0) +
                      Number(row.m3 || 0) +
                      Number(row.m4 || 0)) /
                    4;
                  const total = Number(((avg / 100) * 20).toFixed(2));
                  return (
                    <tr
                      key={`viva-${rowIndex}`}
                      className={
                        rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      }
                    >
                      <td className={TD}>{row.name || "—"}</td>
                      <td className={`${TD} font-mono text-blue-600`}>
                        {row.studentId || "—"}
                      </td>
                      <td className={TD}>{project?.title || "—"}</td>
                      <td className={TD}>
                        {row.supervisor || project?.supervisorId?.name || "—"}
                      </td>
                      {["m1", "m2", "m3"].map((f) => (
                        <td
                          key={f}
                          className="px-2 py-2 border border-gray-200 text-center bg-yellow-50"
                        >
                          <YellowInput
                            value={row[f] || ""}
                            onChange={(v) => updateFinalVivaRow(rowIndex, f, v)}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 border border-gray-400 text-center bg-yellow-100 ring-1 ring-inset ring-green-600">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row.m4 || ""}
                          onChange={(e) =>
                            updateFinalVivaRow(rowIndex, "m4", e.target.value)
                          }
                          className="w-14 px-1 py-1 text-center text-sm border border-green-500 rounded bg-yellow-100 focus:outline-none focus:ring-1 focus:ring-green-600"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2 border border-gray-200 text-center bg-green-50">
                        <GreenBadge value={avg} />
                      </td>
                      <td className="px-4 py-2 border border-gray-200 text-center bg-green-50">
                        <GreenBadge value={total} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Interim / Publication (generic) ── */}
      {(activeTab === "interim" || activeTab === "publication") && (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Index No</th>
                <th className={TH}>Project Title</th>
                <th className={TH}>Supervisor/s</th>
                <th className={TH_C}>
                  Mark (
                  {marksState?.[activeTab]?.max ??
                    MARK_SHEETS.find((s) => s.key === activeTab)?.max}
                  )
                </th>
              </tr>
            </thead>
            <tbody>
              {(marksState?.[activeTab]?.rows || []).map((row, rowIndex) => (
                <tr
                  key={`${activeTab}-${rowIndex}`}
                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/40"}
                >
                  <td className={TD}>{row.name || "—"}</td>
                  <td className={`${TD} font-mono text-blue-600`}>
                    {row.studentId || "—"}
                  </td>
                  <td className={TD}>{project?.title || "—"}</td>
                  <td className={TD}>
                    {row.supervisor || project?.supervisorId?.name || "—"}
                  </td>
                  <td className="px-2 py-2 border border-gray-200 text-center bg-yellow-50">
                    <YellowInput
                      value={row.mark || ""}
                      max={marksState?.[activeTab]?.max ?? 100}
                      onChange={(v) => updateMark(activeTab, rowIndex, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Final Summary ── */}
      {activeTab === "finalSummary" && (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Index No</th>
                <th className={TH}>Project Title</th>
                <th className={TH}>Supervisor/s</th>
                <th className={TH_C}>Proposal (10)</th>
                <th className={TH_C}>Interim (10)</th>
                <th className={TH_C}>Thesis (45)</th>
                <th className={TH_C}>Publication (15)</th>
                <th className={TH_C}>Viva (20)</th>
                <th className={`${TH_C} bg-green-50`}>Total</th>
                <th className={`${TH_C} bg-green-50`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {(marksState.proposal?.rows || []).map((row, rowIndex) => {
                const proposal = Number(
                  marksState.proposal?.rows?.[rowIndex]?.mark || 0,
                );
                const interim = Number(
                  marksState.interim?.rows?.[rowIndex]?.mark || 0,
                );
                const finalReport = Number(
                  marksState.finalReport?.rows?.[rowIndex]?.mark || 0,
                );
                const publication = Number(
                  marksState.publication?.rows?.[rowIndex]?.mark || 0,
                );
                const finalViva = Number(
                  marksState.finalViva?.rows?.[rowIndex]?.mark || 0,
                );
                const total =
                  proposal + interim + finalReport + publication + finalViva;
                const rounded = Math.round(total);
                let grade = "F";
                if (rounded >= 75) grade = "A+";
                else if (rounded >= 70) grade = "A";
                else if (rounded >= 65) grade = "A-";
                else if (rounded >= 60) grade = "B+";
                else if (rounded >= 55) grade = "B";
                else if (rounded >= 50) grade = "B-";
                else if (rounded >= 45) grade = "C+";
                const gradeColor = ["A+", "A", "A-"].includes(grade)
                  ? "text-green-700"
                  : ["B+", "B", "B-"].includes(grade)
                    ? "text-blue-700"
                    : grade === "C+"
                      ? "text-yellow-700"
                      : "text-red-600";
                return (
                  <tr
                    key={`summary-${rowIndex}`}
                    className={
                      rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }
                  >
                    <td className={TD}>{row.name || "—"}</td>
                    <td className={`${TD} font-mono text-blue-600`}>
                      {row.studentId || "—"}
                    </td>
                    <td className={TD}>{project?.title || "—"}</td>
                    <td className={TD}>
                      {row.supervisor || project?.supervisorId?.name || "—"}
                    </td>
                    <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                      {proposal.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                      {interim.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                      {finalReport.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                      {publication.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                      {finalViva.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 border border-gray-200 text-center bg-green-50 font-bold text-green-800">
                      {total.toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-3 border border-gray-200 text-center bg-green-50 font-bold ${gradeColor}`}
                    >
                      {grade}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Project detail view ───────────────────────────────────────────────────────
function ProjectDetailView({
  project,
  onBack,
  onEdit,
  onDelete,
  onProjectUpdated,
}) {
  const uploadedDocs = project.documents || [];
  const docsByKey = Object.fromEntries(
    uploadedDocs.filter((doc) => doc.key).map((doc) => [doc.key, doc]),
  );
  const milestones = project.milestones || {};
  const completedCount = MILESTONES.filter((m) => milestones[m.key]).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to list
        </button>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-sm border border-red-100 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${project.type === "group" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
          >
            {project.type === "group" ? "Group" : "Individual"}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <h2 className="text-base font-semibold text-gray-800">
          {project.title}
        </h2>
        {project.description && (
          <p className="text-sm text-gray-500 mt-1">{project.description}</p>
        )}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Supervisor</p>
            <p className="text-sm font-medium text-gray-700">
              {project.supervisorId?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Start date</p>
            <p className="text-sm font-medium text-gray-700">
              {project.startDate
                ? new Date(project.startDate).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              {project.type === "group" ? "Students" : "Student"}
            </p>
            <div className="flex flex-wrap gap-1">
              {project.students?.length === 0 ? (
                <span className="text-sm text-gray-400">—</span>
              ) : (
                project.students?.map((s) => (
                  <span
                    key={s._id}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                  >
                    {s.name}
                    {s.studentId ? ` (${s.studentId})` : ""}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-700">
            Project Progress
          </h3>
          <span className="text-xs text-gray-400">
            {completedCount} / 4 completed
          </span>
        </div>
        <div className="space-y-3">
          {MILESTONES.map((milestone, idx) => {
            const isChecked = !!milestones[milestone.key];
            return (
              <div
                key={milestone.key}
                className={`flex items-start gap-4 p-4 rounded-xl border ${isChecked ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center ${isChecked ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-200"}`}
                >
                  {isChecked ? (
                    <span className="text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-xs text-gray-400">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${isChecked ? "text-green-700" : "text-gray-500"}`}
                  >
                    {milestone.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {milestone.desc}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${isChecked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                >
                  {isChecked ? "Done" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-4 border-t border-gray-50">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Overall completion</span>
            <span>{Math.round((completedCount / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Submitted documents
          <span className="ml-2 text-xs font-normal text-gray-400">
            {Object.keys(docsByKey).length || uploadedDocs.length} /{" "}
            {EXPECTED_DOCS.length} uploaded
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {EXPECTED_DOCS.map((expected) => {
            const uploaded = docsByKey[expected.key] || null;
            return (
              <div
                key={expected.key}
                className={`rounded-lg border p-3 flex items-center justify-between ${uploaded ? "border-green-100 bg-green-50" : "border-gray-100 bg-gray-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{uploaded ? "📄" : "📭"}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {expected.label}
                    </p>
                    {uploaded ? (
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">
                        {uploaded.name}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Not submitted</p>
                    )}
                  </div>
                </div>
                {uploaded && (
                  <a
                    href={uploaded.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="text-xs text-blue-600 hover:underline ml-2 flex-shrink-0"
                  >
                    ⬇ Download
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ProjectMarksPanel
        project={project}
        onProjectUpdated={onProjectUpdated}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CourseProjectsPage() {
  const params = useParams();
  const rawCourseId = params?.courseId || params?.courseID;
  const courseId =
    typeof rawCourseId === "string"
      ? rawCourseId
      : Array.isArray(rawCourseId)
        ? rawCourseId[0]
        : "";

  const router = useRouter();
  const { batches } = useBatches();

  const [subject, setSubject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selBatch, setSelBatch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [detailProject, setDetailProject] = useState(null);
  const [viewMode, setViewMode] = useState("projects");
  const [markTab, setMarkTab] = useState("proposal");

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/subjects/${courseId}`, { credentials: "include" })
      .then(readJsonSafely)
      .then((d) => {
        if (d?.success) setSubject(d.subject);
      })
      .catch(() => setSubject(null));
  }, [courseId]);

  async function fetchProjects() {
    if (!courseId) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = selBatch
        ? `/api/projects?subjectId=${courseId}&batchId=${selBatch}`
        : `/api/projects?subjectId=${courseId}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await readJsonSafely(res);
      if (data?.success) setProjects(data.projects || []);
      else setProjects([]);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (courseId) fetchProjects();
  }, [courseId, selBatch]);

  const matchingBatches = batches.filter((b) =>
    subject ? b.programme === subject.programme : true,
  );

  useEffect(() => {
    if (!subject || selBatch || matchingBatches.length === 0) return;
    setSelBatch(matchingBatches[0]._id);
  }, [subject, matchingBatches]);

  async function handleDelete(id) {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDetailProject(null);
    fetchProjects();
  }

  return (
    <div>
      <TopHeader
        title={subject ? subject.name : "Projects"}
        subtitle={
          subject
            ? `${subject.code} · Level ${subject.level} · Semester ${subject.semester} · ${subject.programme}`
            : ""
        }
        action={
          <button
            onClick={() => router.back()}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            ← Back
          </button>
        }
      />

      <div className="px-8 py-6">
        {detailProject ? (
          <ProjectDetailView
            project={detailProject}
            onBack={() => setDetailProject(null)}
            onEdit={() => {
              setEditProject(detailProject);
              setShowModal(true);
            }}
            onDelete={() => handleDelete(detailProject._id)}
            onProjectUpdated={(updatedProject) => {
              setDetailProject(updatedProject);
              setProjects((prev) =>
                prev.map((p) =>
                  p._id === updatedProject._id ? updatedProject : p,
                ),
              );
            }}
          />
        ) : (
          <>
            <div className="flex gap-3 mb-6 items-center flex-wrap">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode("projects")}
                  className={`px-4 py-2 text-sm font-medium ${viewMode === "projects" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  Projects
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("marks")}
                  className={`px-4 py-2 text-sm font-medium ${viewMode === "marks" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  Marks
                </button>
              </div>
              <select
                value={selBatch}
                onChange={(e) => setSelBatch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">— All batches —</option>
                {matchingBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditProject(null);
                  setShowModal(true);
                }}
                className="ml-auto bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
              >
                + Add project
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <p className="text-3xl mb-3">📁</p>
                <p className="text-sm text-gray-400">
                  No projects yet for this course.
                </p>
              </div>
            ) : viewMode === "marks" ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap gap-2">
                  {ALL_MARK_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setMarkTab(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border
                        ${markTab === tab.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className={TH}>Name</th>
                        <th className={TH}>Index No</th>
                        <th className={TH}>Project Title</th>
                        <th className={TH}>Supervisor/s</th>
                        {/* ── Thesis (Final Report) columns ── */}
                        {markTab === "finalReport" && (
                          <>
                            <th className={`${TH_C} bg-yellow-50`}>M1</th>
                            <th className={`${TH_C} bg-yellow-50`}>M2</th>
                            <th className={`${TH_C} bg-green-50`}>
                              Average (45%)
                            </th>
                          </>
                        )}
                        {markTab === "proposal" && (
                          <>
                            <th className={TH_C}>M1</th>
                            <th className={TH_C}>M2</th>
                            <th className={TH_C}>M3</th>
                            <th className={TH_C}>M4</th>
                            <th className={TH_C}>Avg PPT (5)</th>
                            <th className={TH_C}>Report (5)</th>
                            <th className={TH_C}>Total (10)</th>
                          </>
                        )}
                        {markTab === "finalViva" && (
                          <>
                            <th className={TH_C}>m1</th>
                            <th className={TH_C}>m2</th>
                            <th className={TH_C}>m3</th>
                            <th className={TH_C}>m4</th>
                            <th className={TH_C}>Average</th>
                            <th className={TH_C}>Total PPT (20%)</th>
                          </>
                        )}
                        {markTab === "finalSummary" && (
                          <>
                            <th className={TH_C}>Proposal (10)</th>
                            <th className={TH_C}>Interim (10)</th>
                            <th className={TH_C}>Thesis (45)</th>
                            <th className={TH_C}>Publication (15)</th>
                            <th className={TH_C}>Viva (20)</th>
                            <th className={`${TH_C} bg-green-50`}>Total</th>
                            <th className={`${TH_C} bg-green-50`}>Grade</th>
                          </>
                        )}
                        {![
                          "proposal",
                          "finalReport",
                          "finalViva",
                          "finalSummary",
                        ].includes(markTab) && (
                          <th className={TH_C}>
                            Mark (
                            {MARK_SHEETS.find((s) => s.key === markTab)?.max ||
                              0}
                            )
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.flatMap((p) => {
                        const projectStudents = p.students?.length
                          ? p.students
                          : [{ _id: p._id, name: "—", studentId: "—" }];
                        return projectStudents.map((student, si) => {
                          const marks = p.marks || buildDefaultMarks(p);
                          const proposal = Number(
                            marks.proposal?.rows?.[si]?.mark || 0,
                          );
                          const interim = Number(
                            marks.interim?.rows?.[si]?.mark || 0,
                          );
                          const finalReport = Number(
                            marks.finalReport?.rows?.[si]?.mark || 0,
                          );
                          const publication = Number(
                            marks.publication?.rows?.[si]?.mark || 0,
                          );
                          const finalViva = Number(
                            marks.finalViva?.rows?.[si]?.mark || 0,
                          );
                          const total =
                            proposal +
                            interim +
                            finalReport +
                            publication +
                            finalViva;
                          const rounded = Math.round(total);
                          let grade = "F";
                          if (rounded >= 75) grade = "A+";
                          else if (rounded >= 70) grade = "A";
                          else if (rounded >= 65) grade = "A-";
                          else if (rounded >= 60) grade = "B+";
                          else if (rounded >= 55) grade = "B";
                          else if (rounded >= 50) grade = "B-";
                          else if (rounded >= 45) grade = "C+";

                          const frRow = marks.finalReport?.rows?.[si] || {
                            m1: 0,
                            m2: 0,
                          };
                          const frFilled = [frRow.m1, frRow.m2].filter(
                            (v) =>
                              v !== "" && v !== undefined && Number(v) !== 0,
                          ).length;
                          const frAvg =
                            frFilled > 0
                              ? (Number(frRow.m1 || 0) +
                                  Number(frRow.m2 || 0)) /
                                frFilled
                              : 0;
                          const frScaled = Number(
                            ((frAvg / 100) * 45).toFixed(2),
                          );

                          const vivaRow = marks.finalViva?.rows?.[si] || {
                            m1: 0,
                            m2: 0,
                            m3: 0,
                            m4: 0,
                          };
                          const vivaAvg =
                            (Number(vivaRow.m1 || 0) +
                              Number(vivaRow.m2 || 0) +
                              Number(vivaRow.m3 || 0) +
                              Number(vivaRow.m4 || 0)) /
                            4;
                          const vivaTotal = Number(
                            ((vivaAvg / 100) * 20).toFixed(2),
                          );

                          const propRow = marks.proposal?.rows?.[si] || {
                            m1: 0,
                            m2: 0,
                            m3: 0,
                            m4: 0,
                            reportMarks: 0,
                          };
                          const propAvg =
                            (Number(propRow.m1 || 0) +
                              Number(propRow.m2 || 0) +
                              Number(propRow.m3 || 0) +
                              Number(propRow.m4 || 0)) /
                            4;
                          const propTotal = Number(
                            Math.min(
                              propAvg + Number(propRow.reportMarks || 0),
                              10,
                            ).toFixed(2),
                          );

                          const gradeColor = ["A+", "A", "A-"].includes(grade)
                            ? "text-green-700 font-bold"
                            : ["B+", "B", "B-"].includes(grade)
                              ? "text-blue-700 font-bold"
                              : grade === "C+"
                                ? "text-yellow-700 font-bold"
                                : "text-red-600 font-bold";

                          return (
                            <tr
                              key={`${p._id}-${student._id || si}`}
                              className="border-b border-gray-200 hover:bg-blue-50/30"
                            >
                              <td className={TD}>{student.name || "—"}</td>
                              <td className={`${TD} font-mono text-blue-600`}>
                                {student.studentId || "—"}
                              </td>
                              <td className={TD}>{p.title || "—"}</td>
                              <td className={TD}>
                                {p.supervisorId?.name || "—"}
                              </td>

                              {/* Thesis (Final Report) — M1, M2, Average (45%) */}
                              {markTab === "finalReport" && (
                                <>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-yellow-50 text-sm">
                                    {frRow.m1 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-yellow-50 text-sm">
                                    {frRow.m2 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-green-50 font-semibold text-green-800">
                                    {frFilled > 0 ? frScaled : "—"}
                                  </td>
                                </>
                              )}
                              {markTab === "proposal" && (
                                <>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {propRow.m1 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {propRow.m2 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {propRow.m3 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {propRow.m4 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center font-semibold">
                                    {propAvg.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {propRow.reportMarks || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center font-semibold">
                                    {propTotal}
                                  </td>
                                </>
                              )}
                              {markTab === "finalViva" && (
                                <>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {vivaRow.m1 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {vivaRow.m2 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {vivaRow.m3 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center">
                                    {vivaRow.m4 || 0}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center font-semibold">
                                    {vivaAvg.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center font-semibold">
                                    {vivaTotal}
                                  </td>
                                </>
                              )}
                              {markTab === "finalSummary" && (
                                <>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                                    {proposal.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                                    {interim.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                                    {finalReport.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                                    {publication.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-blue-50/50">
                                    {finalViva.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 border border-gray-200 text-center bg-green-50 font-bold text-green-800">
                                    {total.toFixed(2)}
                                  </td>
                                  <td
                                    className={`px-3 py-3 border border-gray-200 text-center bg-green-50 ${gradeColor}`}
                                  >
                                    {grade}
                                  </td>
                                </>
                              )}
                              {![
                                "proposal",
                                "finalReport",
                                "finalViva",
                                "finalSummary",
                              ].includes(markTab) && (
                                <td className="px-3 py-3 border border-gray-200 text-center font-semibold">
                                  {markTab === "interim"
                                    ? interim
                                    : markTab === "publication"
                                      ? publication
                                      : 0}
                                </td>
                              )}
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className={TH}>Student Name</th>
                      <th className={TH}>Index Number</th>
                      <th className={TH}>Project Title</th>
                      <th className={TH}>Supervisor Name</th>
                      <th className={TH_C}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.flatMap((p) => {
                      const projectStudents = p.students?.length
                        ? p.students
                        : [{ _id: p._id, name: "—", studentId: "—" }];
                      return projectStudents.map((student, si) => (
                        <tr
                          key={`${p._id}-${student._id || si}`}
                          onClick={() => setDetailProject(p)}
                          className="cursor-pointer hover:bg-blue-50/30 transition-colors border-b border-gray-200"
                        >
                          <td className={TD}>{student.name || "—"}</td>
                          <td className={`${TD} font-mono text-blue-600`}>
                            {student.studentId || "—"}
                          </td>
                          <td className={TD}>{p.title || "—"}</td>
                          <td className={TD}>{p.supervisorId?.name || "—"}</td>
                          <td
                            className="px-4 py-4 border border-gray-200 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setEditProject(p);
                                  setShowModal(true);
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(p._id)}
                                className="text-xs text-red-400 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ProjectFormModal
          project={editProject}
          courseId={courseId}
          batchId={selBatch || matchingBatches[0]?._id || ""}
          onClose={() => {
            setShowModal(false);
            setEditProject(null);
          }}
          onSaved={() => {
            fetchProjects();
            setDetailProject(null);
          }}
        />
      )}
    </div>
  );
}
