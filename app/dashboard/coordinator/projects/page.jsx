"use client";

import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import { useSubjects } from "@/hooks/useSubjects";
import { useBatches } from "@/hooks/useBatches";

const PROG_COLORS = {
  BSc: "bg-purple-100 text-purple-700 border-purple-200",
  BCS: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { subjects, loading } = useSubjects();
  const { batches } = useBatches();

  const projectSubjects = subjects.filter((s) => s.type === "project");
  const bscSubjects = projectSubjects.filter((s) => s.programme === "BSc");
  const bcsSubjects = projectSubjects.filter((s) => s.programme === "BCS");

  function getBatch(subject) {
    return batches.filter((b) => b.programme === subject.programme);
  }

  function renderCards(list) {
    if (list.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">No project courses yet.</p>
        </div>
      );
    }

    return list.map((s) => {
      const matchingBatches = getBatch(s);
      return (
        <div
          key={s._id}
          onClick={() =>
            router.push(`/dashboard/coordinator/projects/${s._id}`)
          }
          className="bg-white border border-gray-100 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PROG_COLORS[s.programme]}`}
            >
              {s.programme}
            </span>
            <span className="text-xs text-gray-400">
              Level {s.level} · Sem {s.semester}
            </span>
          </div>

          <p className="text-xs font-mono text-gray-400 mb-1">{s.code}</p>

          <h3 className="text-sm font-semibold text-gray-800 mb-3 group-hover:text-blue-700 transition-colors">
            {s.name}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
              {s.assignedLecturer?.name?.charAt(0) || "?"}
            </div>
            <p className="text-xs text-gray-500">
              {s.assignedLecturer?.name || "No coordinator assigned"}
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            {matchingBatches.length === 0 ? (
              <span className="text-xs text-gray-400">No batches</span>
            ) : (
              matchingBatches.map((b) => (
                <span
                  key={b._id}
                  className="text-sm px-2 py-0.5 rounded-full bg-blue-100 text-blue-800"
                >
                  {b.name}
                </span>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">View projects →</span>
          </div>
        </div>
      );
    });
  }

  return (
    <div>
      <TopHeader
        title="Projects"
        subtitle="Project courses grouped by programme"
      />

      <div className="px-8 py-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <div className="bg-blue-900 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">BSc</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/15 text-white">
                    {bscSubjects.length} courses
                  </span>
                </div>
              </div>
              <div className="space-y-3">{renderCards(bscSubjects)}</div>
            </div>

            <div>
              <div className="mb-4">
                <div className="bg-blue-900 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">BCS</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/15 text-white">
                    {bcsSubjects.length} courses
                  </span>
                </div>
              </div>
              <div className="space-y-3">{renderCards(bcsSubjects)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
