"use client";

import { useState, useEffect } from "react";
import TopHeader from "@/components/TopHeader";
import StatCard from "@/components/StatCard";
import PendingApprovals from "@/components/PendingApprovals";
import ApprovalModal from "@/components/ApprovalModal";

export default function HodDashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalLecturers, setTotalLecturers] = useState(0);
  const [totalVisiting, setTotalVisiting] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch stats from a new endpoint or call multiple endpoints
        const statsRes = await fetch("/api/dashboard", {
          credentials: "include",
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setTotalStudents(data.totalStudents || 0);
          setTotalLecturers(data.totalLecturers || 0);
          setTotalVisiting(data.totalVisiting || 0);
        }

        // Fetch pending requests
        const requestsRes = await fetch("/api/request-access", {
          credentials: "include",
        });
        if (requestsRes.ok) {
          const data = await requestsRes.json();
          const filtered = (data.requests || []).filter(
            (r) => r.status === "pending",
          );
          setPendingRequests(filtered);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  function handleAddUser(request) {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  }

  function handleReject(id) {
    setPendingRequests((prev) => prev.filter((r) => r._id !== id));
  }

  async function handleApproved() {
    setShowApprovalModal(false);
    setSelectedRequest(null);

    // Refresh stats
    try {
      const statsRes = await fetch("/api/dashboard", {
        credentials: "include",
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setTotalStudents(data.totalStudents || 0);
        setTotalLecturers(data.totalLecturers || 0);
        setTotalVisiting(data.totalVisiting || 0);
      }
    } catch (err) {
      console.error("Failed to refresh stats", err);
    }

    // Refresh pending requests
    try {
      const res = await fetch("/api/request-access", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.requests || []).filter(
          (r) => r.status === "pending",
        );
        setPendingRequests(filtered);
      }
    } catch (err) {
      console.error("Failed to refresh requests", err);
    }
  }

  const pendingCount = pendingRequests.length;

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
            label="Pending Approvals"
            value={pendingCount}
            sub="Access requests"
            color="red"
          />
          <StatCard
            label="Active Batches"
            value="0"
            sub="BSc & BCS"
            color="green"
          />
        </div>

        {/* Panels */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Pending Approvals
            </h2>
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : (
              <PendingApprovals
                initial={pendingRequests}
                onAddUser={handleAddUser}
                onReject={handleReject}
                onApproved={handleApproved}
              />
            )}
          </div>

          <div className="bg-blue-100 rounded-xl border border-gray-100 p-5">
            <h2 className="text-m font-semibold text-blue-700 mb-4">
              Recent Activity
            </h2>
            <p className="text-sm text-blue-400">No recent activity yet.</p>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRequest(null);
          }}
          onApproved={handleApproved}
        />
      )}
    </div>
  );
}