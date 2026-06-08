"use client";

import { useState, useEffect } from "react";

export default function PendingApprovals({
  initial = [],
  onAddUser,
  onReject,
  onApproved,
}) {
  const [requests, setRequests] = useState(initial);
  const [loadingId, setLoadingId] = useState(null);

  // keep local requests in sync when parent updates the `initial` prop
  useEffect(() => {
    setRequests(initial || []);
  }, [initial]);

  async function handleReject(id) {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/request-access/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed");
      setRequests((prev) => prev.filter((r) => r._id !== id));
      if (onReject) onReject(id);
    } catch (err) {
      alert("Error: " + (err.message || "Failed to reject"));
    } finally {
      setLoadingId(null);
    }
  }

  function handleAddUser(r) {
    if (onAddUser) {
      onAddUser(r);
      // Note: After approval is complete, parent will call onApproved callback
      // which will refresh the list and remove this item
    }
  }

  // Callback to remove item after parent confirms approval
  const removeApprovedRequest = (id) => {
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  if (!requests || requests.length === 0)
    return (
      <p className="text-sm text-gray-400">No pending approvals right now.</p>
    );

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div
          key={r._id}
          className="flex items-center justify-between p-3 bg-linear-to-r from-blue-50 to-transparent border border-blue-100 rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">
              {r.name}
              <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {r.role}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {r.email} {r.studentNumber && `• ${r.studentNumber}`}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleAddUser(r)}
              className="text-xs font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => handleReject(r._id)}
              disabled={loadingId === r._id}
              className="text-xs font-semibold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingId === r._id ? "..." : "✕ Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
