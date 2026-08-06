"use client";

import { useState } from "react";
import TopHeader from "@/components/TopHeader";
import { useSubjects } from "@/hooks/useSubjects";
import { useUsers } from "@/hooks/useUsers";
import { useBatches } from "@/hooks/useBatches";
import { useAssignments } from "@/hooks/useAssignments";

const TYPE_COLORS = {
  theory: "bg-blue-100 text-blue-700",
  practical: "bg-green-100 text-green-700",
  project: "bg-purple-100 text-purple-700",
};

const PROG_COLORS = {
  BSc: "bg-purple-100 text-purple-700",
  BCS: "bg-orange-100 text-orange-700",
};

export default function SubjectsPage() {
  const { subjects, loading, refetch } = useSubjects();
  const { users: lecturers } = useUsers("lecturer");
  const { batches } = useBatches();
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  async function handleDelete(id) {
    if (!confirm("Delete this subject?")) return;
    const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) refetch();
  }

  const bscSubjects = subjects.filter(
    (s) => s.programme === "BSc" || s.programme === "Both",
  );
  const bcsSubjects = subjects.filter(
    (s) => s.programme === "BCS" || s.programme === "Both",
  );

  const renderTable = (list) => (
    <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-blue-100 bg-blue-50">
            <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
              Code
            </th>
            <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
              Subject
            </th>
            <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
              Type
            </th>
            <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
              Level
            </th>
            <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
              Credits
            </th>
            <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-blue-400">
                No subjects
              </td>
            </tr>
          ) : (
            list.map((s) => (
              <tr
                key={s._id}
                className="border-b border-blue-50 hover:bg-blue-50"
              >
                <td className="px-5 py-3 font-mono text-blue-700">{s.code}</td>
                <td className="px-5 py-3 text-blue-800">{s.name}</td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.type]}`}
                  >
                    {s.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-blue-600">Level {s.level}</td>
                <td className="px-5 py-3 text-blue-600">{s.credits}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <TopHeader
        title="Courses"
        subtitle="Manage all theory, practical, and project courses"
        action={
          <button
            onClick={() => {
              setEditingSubject(null);
              setShowModal(true);
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
          >
            + Add new course
          </button>
        }
      />

      <div className="px-8 py-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-8">
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  BSc Programme
                </h2>
              </div>
              {renderTable(bscSubjects)}
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  BCS Programme
                </h2>
              </div>
              {renderTable(bcsSubjects)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
