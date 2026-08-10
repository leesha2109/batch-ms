"use client";

import { useState, useEffect } from "react";
import { FileText, FileType, Download } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import StatCard from "@/components/StatCard";

export default function HodDashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalLecturers, setTotalLecturers] = useState(0);
  const [totalVisiting, setTotalVisiting] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [bscActive, setBscActive] = useState(0);
  const [bcsActive, setBcsActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const statsRes = await fetch("/api/dashboard", {
          credentials: "include",
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setTotalStudents(data.totalStudents || 0);
          setTotalLecturers(data.totalLecturers || 0);
          setTotalVisiting(data.totalVisiting || 0);
          setTotalBatches(data.totalBatches || 0);
          setBscActive(data.bscActive || 0);
          setBcsActive(data.bcsActive || 0);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div>
      <TopHeader
        title="Dashboard"
        subtitle="Welcome back, manage your batch and requests"
      />

      <div className="px-8 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Students"
            value={totalStudents}
            sub="Across all batches"
            color="blue"
          />
          <StatCard
            label="Lecturers"
            value={totalLecturers}
            sub={`+ ${totalVisiting} visiting`}
            color="purple"
          />
          <StatCard
            label="Visiting Lecturers"
            value={totalVisiting}
            sub="Adjunct and guests"
            color="red"
          />
          <StatCard
            label="Active Batches"
            value={totalBatches}
            sub={`BSc: ${bscActive} · BCS: ${bcsActive}`}
            color="green"
          />
        </div>

        {/* Panels */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Resources & Guidance
            </h2>
            <p className="text-sm leading-6 text-gray-600">
              Access key documents and support materials for managing batches,
              schedules, and lecturer resources.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4 bg-slate-50">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Active Batches
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {totalBatches}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 bg-slate-50">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Active Lecturers
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {totalLecturers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Downloads
            </h2>
            <div className="space-y-3">
              <a
                href="/documents/visiting-lecturer-declaration-form.pdf"
                download
                className="flex items-center justify-between p-3 rounded-lg border border-blue-500 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Visiting Lecturer Declaration Form
                    </p>
                    <p className="text-xs text-gray-400">PDF Document</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-400 shrink-0" />
              </a>

              <a
                href="/documents/visiting-lecturer-appointment-letter.docx"
                download
                className="flex items-center justify-between p-3 rounded-lg border border-blue-500 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileType className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Visiting Lecturer Appointment Letter
                    </p>
                    <p className="text-xs text-gray-400">Word Document</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-400 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
