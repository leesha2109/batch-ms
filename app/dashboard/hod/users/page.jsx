"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUsers } from "@/hooks/useUsers";
import UserModal from "@/components/UserModal";
import TopHeader from "@/components/TopHeader";

const ROLE_TABS = [
  { label: "All", value: "" },
  { label: "Coordinators", value: "coordinator" },
  { label: "Lecturers", value: "lecturer" },
  { label: "Visiting Lecturers", value: "visiting_lecturer" },
  { label: "Students", value: "student" },
];

const ROLE_COLORS = {
  hod: "bg-purple-100 text-purple-700",
  coordinator: "bg-blue-100 text-blue-700",
  lecturer: "bg-green-100 text-green-700",
  visiting_lecturer: "bg-orange-100 text-orange-700",
  student: "bg-gray-100 text-gray-700",
};

const ROLE_LABELS = {
  hod: "HOD",
  coordinator: "Coordinator",
  lecturer: "Lecturer",
  visiting_lecturer: "Visiting Lecturer",
  student: "Student",
};

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("staff"); // "staff" | "student"
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [requestId, setRequestId] = useState(null);

  const { users, loading, error, refetch } = useUsers(activeTab);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("pendingRequest");
    if (stored) {
      const { name, email, role, studentId, requestId } = JSON.parse(stored);
      setEditingUser({ name, email, role, studentId: studentId || "" });
      setModalMode(role === "student" ? "student" : "staff");
      setRequestId(requestId);
      setShowModal(true);
      localStorage.removeItem("pendingRequest");
    }
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  function handleEdit(user) {
    setEditingUser(user);
    setModalMode(user.role === "student" ? "student" : "staff");
    setRequestId(null);
    setShowModal(true);
  }

  function handleAddLecturer() {
    setEditingUser(null);
    setModalMode("staff");
    setRequestId(null);
    setShowModal(true);
  }

  function handleEnrollStudent() {
    setEditingUser(null);
    setModalMode("student");
    setRequestId(null);
    setShowModal(true);
  }

  async function handleModalSaved() {
    if (requestId) {
      await fetch(`/api/request-access/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setRequestId(null);
    }
    refetch();
    setShowModal(false);
    setEditingUser(null);
  }

  async function handleDeactivate(id) {
    if (!confirm("Deactivate this user?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Failed to deactivate user");
      } else {
        refetch();
      }
    } catch (err) {
      alert("Failed to contact server");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <TopHeader
        title="User Management"
        subtitle="Manage all system users and their roles"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleEnrollStudent}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              + Enroll new student
            </button>
            <button
              onClick={handleAddLecturer}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
            >
              + Add new lecturer
            </button>
          </div>
        }
      />

      <div className="px-8 py-6">
        <div className="flex gap-1 mb-5 border-b border-gray-100">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px
                ${
                  activeTab === tab.value
                    ? "border-gray-900 text-gray-900 font-medium"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading users...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Role</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Created</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{user.name}</td>
                      <td className="px-5 py-3 text-gray-500">{user.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => handleEdit(user)} className="text-xs text-blue-600 hover:underline">
                            Edit
                          </button>
                          {user.isActive && (
                            <button
                              onClick={() => handleDeactivate(user._id)}
                              disabled={deletingId === user._id}
                              className="text-xs text-red-400 hover:underline disabled:opacity-50"
                            >
                              {deletingId === user._id ? "..." : "Deactivate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
            setRequestId(null);
          }}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}