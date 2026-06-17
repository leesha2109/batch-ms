"use client";

import { useState } from "react";
import { useBatches } from "@/hooks/useBatches";
import BatchModal from "@/components/BatchModal";
import SemesterModal from "@/components/SemesterModal";
import TopHeader from "@/components/TopHeader";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100  text-gray-500",
  upcoming: "bg-blue-100  text-blue-700",
};

const SEM_COLORS = {
  completed: "bg-green-100 text-green-700",
  active: "bg-blue-100  text-blue-700",
  planned: "bg-gray-100  text-gray-500",
};

// Programme tab definitions — dark blue theme
const PROGRAMME_TABS = [
  {
    key: "BSc",
    label: "BSc",
    fullLabel: "BSc (Hons) in Computer Science",
    icon: "🎓",
  },
  {
    key: "BCS",
    label: "BCS",
    fullLabel: "BCS (Hons) in Computer Science",
    icon: "💻",
  },
];

export default function BatchesPage() {
  const { batches, loading, error, refetch } = useBatches();
  const [activeProgramme, setActiveProgramme] = useState("BSc");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingSem, setEditingSem] = useState(null);

  // filter batches by the active programme tab
  const programmeBatches = batches.filter(
    (b) => b.programme === activeProgramme,
  );

  const displayed = selectedBatch
    ? batches.find((b) => b._id === selectedBatch._id) || selectedBatch
    : null;

  function getSlots(programme) {
    if (programme === "BSc") return 4;
    if (programme === "BCS") return 2;
    return 8;
  }

  const displayedSemesters = displayed?.semesters || [];
  const slots = displayed ? getSlots(displayed.programme) : 0;
  const fullSemesters = displayed
    ? Array.from(
        { length: slots },
        (_, idx) =>
          displayedSemesters.find((sem) => sem.semesterNumber === idx + 1) || {
            _id: `placeholder-${idx + 1}`,
            semesterNumber: idx + 1,
            status: "planned",
            placeholder: true,
          },
      )
    : [];

  const completedSemestersCount = fullSemesters.filter(
    (s) => s.status === "completed",
  ).length;

  function handleEditBatch(batch) {
    setEditingBatch(batch);
    setShowBatchModal(true);
  }

  function handleProgrammeChange(programme) {
    setActiveProgramme(programme);
    // clear selection if it belongs to the other programme
    if (selectedBatch && selectedBatch.programme !== programme) {
      setSelectedBatch(null);
    }
  }

  async function refreshSelectedBatch(id) {
    if (!id) return;
    const res = await fetch(`/api/batches/${id}`);
    const data = await res.json();
    if (data.success) {
      setSelectedBatch(data.batch);
    }
  }

  async function handleDeleteBatch(id) {
    if (!confirm("Delete this batch? This cannot be undone.")) return;

    const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || "Failed to delete batch");
      return;
    }

    setSelectedBatch(null);
    refetch();
  }

  return (
    <div>
      <TopHeader
        title="Batches & Semesters"
        subtitle="Manage intake batches and their semesters"
        action={
          <button
            onClick={() => {
              setEditingBatch(null);
              setShowBatchModal(true);
            }}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors"
          >
            + New batch
          </button>
        }
      />

      <div className="px-8 py-6">
        {/* Programme tabs — BSc / BCS */}
        <div className="flex gap-3 mb-6">
          {PROGRAMME_TABS.map((tab) => {
            const count = batches.filter((b) => b.programme === tab.key).length;
            const isActive = activeProgramme === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => handleProgrammeChange(tab.key)}
                className={`flex-1 max-w-xs rounded-xl px-5 py-4 text-left transition-all border
                  ${
                    isActive
                      ? "bg-blue-900 border-blue-900 shadow-sm"
                      : "bg-blue-50 border-blue-100 hover:border-blue-300 hover:bg-blue-100"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-base font-semibold ${
                      isActive ? "text-white" : "text-blue-900"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${
                        isActive
                          ? "bg-blue-700 text-blue-50"
                          : "bg-blue-200 text-blue-800"
                      }`}
                  >
                    {count} {count === 1 ? "batch" : "batches"}
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    isActive ? "text-blue-200" : "text-blue-500"
                  }`}
                >
                  {tab.fullLabel}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex gap-6">
          {/* Left — batch list (filtered by programme) */}
          <div className="w-72 shrink-0 space-y-3">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-3">
              {activeProgramme} batches ({programmeBatches.length})
            </p>

            {loading && <p className="text-sm text-gray-400">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {programmeBatches.map((batch) => (
              <div
                key={batch._id}
                onClick={() => setSelectedBatch(batch)}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all
                  ${
                    selectedBatch?._id === batch._id
                      ? "border-blue-900 shadow-sm ring-1 ring-blue-900"
                      : "border-gray-100 hover:border-blue-300"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {batch.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Intake {batch.intakeYear}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                      {batch.programme}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[batch.status]}`}
                    >
                      {batch.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {batch.coordinatorId
                      ? `👤 ${batch.coordinatorId.name}`
                      : "⚠️ No coordinator"}
                  </span>
                  <span>
                    {batch.semesters?.filter((s) => s.status === "completed")
                      .length || 0}
                    /{getSlots(batch.programme)} sems
                  </span>
                </div>
              </div>
            ))}

            {!loading && programmeBatches.length === 0 && (
              <div className="bg-blue-50 border border-dashed border-blue-200 rounded-xl p-6 text-center">
                <p className="text-sm text-blue-400">
                  No {activeProgramme} batches yet
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  Click + New batch to get started
                </p>
              </div>
            )}
          </div>

          {/* Right — batch detail */}
          {displayed ? (
            <div className="flex-1 space-y-5">
              {/* Batch header card */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {displayed.name}
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {displayed.programme} &nbsp;·&nbsp; Intake{" "}
                      {displayed.intakeYear}
                      &nbsp;·&nbsp; {displayed.totalCreditsRequired} credits
                      required
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditBatch(displayed)}
                      className="text-sm border border-blue-200 text-blue-900 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBatch(displayed._id)}
                      className="text-sm border border-red-100 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-400 mb-1">Coordinator</p>
                    <p className="text-sm font-medium text-blue-900">
                      {displayed.coordinatorId?.name || "— Not assigned"}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-400 mb-1">
                      Graduation target
                    </p>
                    <p className="text-sm font-medium text-blue-900">
                      {displayed.graduationTarget || "— Not set"}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-400 mb-1">
                      Semesters completed
                    </p>
                    <p className="text-sm font-medium text-blue-900">
                      {completedSemestersCount}
                      &nbsp;/&nbsp;
                      {fullSemesters.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Semester timeline */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Semester timeline
                </h3>

                <div className="flex gap-1 mb-5">
                  {fullSemesters.map((sem) => (
                    <div key={sem._id} className="flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        S{sem.semesterNumber}
                      </p>
                      <div
                        className={`h-6 rounded text-xs flex items-center justify-center font-medium
                        ${SEM_COLORS[sem.status]}`}
                      >
                        {sem.status === "active"
                          ? "●"
                          : sem.status === "completed"
                            ? "✓"
                            : "○"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Semester list */}
                <div className="space-y-2">
                  {fullSemesters.map((sem) => (
                    <div
                      key={sem._id}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border
                        ${
                          sem.status === "active"
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-100 bg-gray-50"
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            Semester {sem.semesterNumber}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEM_COLORS[sem.status]}`}
                          >
                            {sem.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {sem.startDate
                            ? `${new Date(sem.startDate).toLocaleDateString()} → ${new Date(sem.endDate).toLocaleDateString()}`
                            : "Dates not set"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => !sem.placeholder && setEditingSem(sem)}
                        className={`text-xs text-blue-700 hover:underline ${sem.placeholder ? "opacity-40 cursor-not-allowed" : ""}`}
                        disabled={sem.placeholder}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">
                  {PROGRAMME_TABS.find((t) => t.key === activeProgramme)?.icon}
                </p>
                <p className="text-sm text-gray-400">
                  Select a {activeProgramme} batch to view details
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showBatchModal && (
        <BatchModal
          batch={editingBatch}
          onClose={() => setShowBatchModal(false)}
          onSaved={(batch) => {
            refetch();
            if (batch?._id) {
              refreshSelectedBatch(batch._id);
            }
          }}
        />
      )}

      {editingSem && (
        <SemesterModal
          batchId={displayed._id}
          semester={editingSem}
          onClose={() => setEditingSem(null)}
          onSaved={(batch) => {
            refetch();
            setSelectedBatch(batch);
            setEditingSem(null);
          }}
        />
      )}
    </div>
  );
}