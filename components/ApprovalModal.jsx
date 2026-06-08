"use client";

import { useState } from "react";

const ROLES = [
  { value: "coordinator", label: "Batch Coordinator" },
  { value: "lecturer", label: "Lecturer" },
  { value: "visiting_lecturer", label: "Visiting Lecturer" },
  { value: "student", label: "Student" },
];

export default function ApprovalModal({ request, onClose, onApproved }) {
  const [form, setForm] = useState({
    name: request.name,
    email: request.email,
    password: "",
    role: request.role === "student" ? "student" : request.role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!form.password) {
        setError("Password is required");
        setLoading(false);
        return;
      }

      // Call PATCH to request-access with createUser=true so server creates the
      // user and marks the request approved atomically (avoids race/inconsistency)
      const approveRes = await fetch(`/api/request-access/${request._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "approve",
          createUser: true,
          password: form.password,
        }),
      });

      const approveData = await approveRes.json();

      // Check both success flag and HTTP status
      if (!approveRes.ok || !approveData.success) {
        const errorMsg =
          approveData.message ||
          `Request failed with status ${approveRes.status}`;
        setError(errorMsg);
        setLoading(false);
        return;
      }

      onApproved();
      onClose();
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Approve & Create User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Full name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Email address
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Minimum 6 characters"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
