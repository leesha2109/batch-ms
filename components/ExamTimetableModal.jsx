"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function ExamTimetableModal({
  entry,
  batchId,
  semester,
  assignments,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(entry?._id);
  const [form, setForm] = useState({
    subject: entry?.subject?._id || "",
    examDate: entry?.examDate ? entry.examDate.slice(0, 10) : "",
    startTime: entry?.startTime || "",
    endTime: entry?.endTime || "",
    venue: entry?.venue || "",
    examType: entry?.examType || "theory",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.subject || !form.examDate || !form.startTime || !form.endTime) {
      setError("Subject, date and time are required.");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/exam-timetable/${entry._id}`
        : "/api/exam-timetable";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, batch: batchId, semester }),
      });

      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save exam entry");
      }
    } catch (err) {
      console.error("Failed to save exam entry", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-blue-100">
          <h2 className="text-sm font-semibold text-blue-900">
            {isEditing ? "Edit Exam" : "Add Exam to Timetable"}
          </h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-blue-400 hover:text-blue-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-blue-600 mb-1 block">
              Subject
            </label>
            <select
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2"
            >
              <option value="">Select subject</option>
              {assignments.map((a) => (
                <option key={a.subjectId?._id} value={a.subjectId?._id}>
                  {a.subjectId?.name} ({a.subjectId?.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-blue-600 mb-1 block">
              Exam Date
            </label>
            <input
              type="date"
              value={form.examDate}
              onChange={(e) => updateField("examDate", e.target.value)}
              className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-blue-600 mb-1 block">
                Start Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-blue-600 mb-1 block">
                End Time
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-blue-600 mb-1 block">
              Venue
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => updateField("venue", e.target.value)}
              placeholder="e.g. Main Hall"
              className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-blue-600 mb-1 block">
              Exam Type
            </label>
            <select
              value={form.examType}
              onChange={(e) => updateField("examType", e.target.value)}
              className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2"
            >
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-lg py-2 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add to Timetable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
