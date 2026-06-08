"use client";

import { useState, useEffect } from "react";
import { useUsers } from "@/hooks/useUsers";

export default function BatchModal({ batch, onClose, onSaved }) {
  const isEditing = !!batch;
  const { users: coordinators } = useUsers("coordinator");

  const [form, setForm] = useState({
    name: "",
    programme: "BSc",
    intakeYear: new Date().getFullYear(),
    coordinatorId: "",
    totalCreditsRequired: 120,
    graduationTarget: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (batch) {
      setForm({
        name: batch.name,
        programme: batch.programme,
        intakeYear: batch.intakeYear,
        coordinatorId: batch.coordinatorId?._id || "",
        totalCreditsRequired: batch.totalCreditsRequired,
        graduationTarget: batch.graduationTarget || "",
        status: batch.status,
      });
    }
  }, [batch]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEditing ? `/api/batches/${batch._id}` : "/api/batches";
      const method = isEditing ? "PATCH" : "POST";
      const payload = {
        ...form,
        intakeYear: Number(form.intakeYear),
        totalCreditsRequired: Number(form.totalCreditsRequired),
        coordinatorId: form.coordinatorId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {isEditing ? "Edit batch" : "Create new batch"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Batch name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. BSc 2022"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Programme
              </label>
              <select
                name="programme"
                value={form.programme}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="BSc">BSc</option>
                <option value="BCS">BCS</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Intake year
              </label>
              <input
                name="intakeYear"
                type="number"
                value={form.intakeYear}
                onChange={handleChange}
                required
                min="2000"
                max="2100"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Assign coordinator
            </label>
            <select
              name="coordinatorId"
              value={form.coordinatorId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">— No coordinator yet —</option>
              {coordinators.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Total credits required
              </label>
              <input
                name="totalCreditsRequired"
                type="number"
                value={form.totalCreditsRequired}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Graduation target
            </label>
            <input
              name="graduationTarget"
              value={form.graduationTarget}
              onChange={handleChange}
              placeholder="e.g. June 2026"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
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
                  : "Create batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
