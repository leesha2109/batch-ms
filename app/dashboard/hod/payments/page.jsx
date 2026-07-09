"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import StatCard from "@/components/StatCard";
import PaymentModal from "@/components/PaymentModal";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [expandedLecturer, setExpandedLecturer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [statusFilter, batchFilter]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([
      loadPayments(),
      loadLecturers(),
      loadBatches(),
      loadSubjects(),
    ]);
    setLoading(false);
  }

  async function loadPayments() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (batchFilter !== "all") params.set("batch", batchFilter);

      const res = await fetch(`/api/payments?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Failed to load payments", err);
    }
  }

  async function loadLecturers() {
    try {
      const res = await fetch("/api/users?role=visiting_lecturer", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLecturers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load lecturers", err);
    }
  }

  async function loadBatches() {
    try {
      const res = await fetch("/api/batches", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Failed to load batches", err);
    }
  }

  async function loadSubjects() {
    try {
      const res = await fetch("/api/subjects", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Failed to load subjects", err);
    }
  }

  async function markAsPaid(payment) {
    try {
      const res = await fetch(`/api/payments/${payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "paid", paymentDate: new Date() }),
      });
      if (res.ok) {
        loadPayments();
      }
    } catch (err) {
      console.error("Failed to mark as paid", err);
    }
  }

  function openAddModal(lecturerId = null) {
    setEditingPayment(lecturerId ? { lecturer: lecturerId } : null);
    setShowModal(true);
  }

  function openEditModal(payment) {
    setEditingPayment(payment);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditingPayment(null);
  }

  function handleSaved() {
    handleModalClose();
    loadPayments();
  }

  // Group payments by lecturer
  const groupedByLecturer = useMemo(() => {
    const groups = {};
    for (const p of payments) {
      const lecturerId = p.lecturer?._id || "unknown";
      if (!groups[lecturerId]) {
        groups[lecturerId] = {
          lecturer: p.lecturer,
          records: [],
          totalPaid: 0,
          totalPending: 0,
        };
      }
      groups[lecturerId].records.push(p);
      if (p.status === "paid") {
        groups[lecturerId].totalPaid += p.amount;
      } else {
        groups[lecturerId].totalPending += p.amount;
      }
    }
    return Object.values(groups);
  }, [payments]);

  // Summary stats
  const stats = useMemo(() => {
    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);
    const lecturersWithPending = new Set(
      payments
        .filter((p) => p.status === "pending")
        .map((p) => p.lecturer?._id),
    ).size;

    const now = new Date();
    const paidThisMonth = payments
      .filter((p) => {
        if (p.status !== "paid" || !p.paymentDate) return false;
        const d = new Date(p.paymentDate);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalPaid, totalPending, lecturersWithPending, paidThisMonth };
  }, [payments]);

  function formatCurrency(amount) {
    return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
  }

  return (
    <div>
      <TopHeader
        title="Visiting Lecturer Payments"
        subtitle="Track payment history and dues for visiting lecturers"
      />

      <div className="px-8 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Paid"
            value={formatCurrency(stats.totalPaid)}
            sub="All time"
            color="green"
          />
          <StatCard
            label="Total Pending"
            value={formatCurrency(stats.totalPending)}
            sub="Awaiting payment"
            color="red"
          />
          <StatCard
            label="Lecturers Awaiting"
            value={stats.lecturersWithPending}
            sub="With pending dues"
            color="purple"
          />
          <StatCard
            label="Paid This Month"
            value={formatCurrency(stats.paidThisMonth)}
            sub={new Date().toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
            color="blue"
          />
        </div>

        {/* Filters + Add button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>

            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 text-sm font-medium text-white bg-[#1e293b] hover:bg-[#0f172a] px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Payment Record
          </button>
        </div>

        {/* Grouped by lecturer */}
        {loading ? (
          <p className="text-sm text-gray-400 mt-6">
            Loading payment records...
          </p>
        ) : groupedByLecturer.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-400">No payment records yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedByLecturer.map((group) => {
              const isExpanded = expandedLecturer === group.lecturer?._id;
              return (
                <div
                  key={group.lecturer?._id || Math.random()}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedLecturer(
                        isExpanded ? null : group.lecturer?._id,
                      )
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">
                          {group.lecturer?.name || "Unknown Lecturer"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {group.records.length} payment record
                          {group.records.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Paid</p>
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(group.totalPaid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Pending</p>
                        <p className="text-sm font-semibold text-red-500">
                          {formatCurrency(group.totalPending)}
                        </p>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddModal(group.lecturer?._id);
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50"
                      >
                        + Add
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 bg-gray-50">
                            <th className="text-left font-medium px-4 py-2">
                              Batch
                            </th>
                            <th className="text-left font-medium px-4 py-2">
                              Subject
                            </th>
                            <th className="text-left font-medium px-4 py-2">
                              Semester
                            </th>
                            <th className="text-left font-medium px-4 py-2">
                              Hours
                            </th>
                            <th className="text-left font-medium px-4 py-2">
                              Rate/hr
                            </th>
                            <th className="text-left font-medium px-4 py-2">
                              Amount
                            </th>
                            <th className="text-left font-medium px-4 py-2">
                              Status
                            </th>
                            <th className="text-left font-medium px-4 py-2">
                              Date
                            </th>
                            <th className="text-left font-medium px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.records.map((p) => (
                            <tr key={p._id} className="border-t border-gray-50">
                              <td className="px-4 py-3 text-gray-700">
                                {p.batch?.name || "-"}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {p.subject?.name || "-"}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                Sem {p.semester}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {p.hoursTaught}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {formatCurrency(p.ratePerHour)}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {formatCurrency(p.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                                    p.status === "paid"
                                      ? "bg-green-50 text-green-600"
                                      : "bg-amber-50 text-amber-600"
                                  }`}
                                >
                                  {p.status === "paid" ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  {p.status === "paid" ? "Paid" : "Pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">
                                {p.paymentDate
                                  ? new Date(p.paymentDate).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  {p.status === "pending" && (
                                    <button
                                      onClick={() => markAsPaid(p)}
                                      className="text-xs font-medium text-green-600 hover:text-green-700"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditModal(p)}
                                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <PaymentModal
          payment={editingPayment}
          lecturers={lecturers}
          batches={batches}
          subjects={subjects}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
