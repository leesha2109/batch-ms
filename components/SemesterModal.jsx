"use client";

import { useState, useEffect } from "react";

export default function SemesterModal({ batchId, semester, onClose, onSaved }) {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    status: "planned",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (semester) {
      setForm({
        startDate: semester.startDate
          ? new Date(semester.startDate).toISOString().split("T")[0]
          : "",
        endDate: semester.endDate
          ? new Date(semester.endDate).toISOString().split("T")[0]
          : "",
        status: semester.status,
      });
    }
  }, [semester]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      const res = await fetch(
        `/api/batches/${batchId}/semesters/${semester._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      onSaved(data.batch);
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
          <h2 className="text-base font-semibold text-blue-800">
            Edit Semester {semester?.semesterNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-md text-blue-500 block mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="text-md text-blue-500 block mb-1">
              Start date
            </label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="text-md text-blue-500 block mb-1">End date</label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-md px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-lg text-md hover:bg-blue-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save semester"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
