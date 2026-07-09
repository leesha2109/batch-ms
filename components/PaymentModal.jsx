"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function PaymentModal({
  payment,
  lecturers,
  batches,
  subjects,
  onClose,
  onSaved,
}) {
  const isEditing = payment && payment._id;

  const [form, setForm] = useState({
    lecturer: payment?.lecturer?._id || payment?.lecturer || "",
    batch: payment?.batch?._id || "",
    selectedAssignment: "",
    subject: payment?.subject?._id || "",
    semester: payment?.semester || "",
    hoursTaught: payment?.hoursTaught || "",
    ratePerHour: payment?.ratePerHour || "",
    amount: payment?.amount || "",
    status: payment?.status || "pending",
    referenceNo: payment?.referenceNo || "",
    remarks: payment?.remarks || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);

  // Auto-calculate amount unless user manually edited it
  const [amountTouched, setAmountTouched] = useState(false);
  useEffect(() => {
    if (!amountTouched) {
      const computed =
        Number(form.hoursTaught || 0) * Number(form.ratePerHour || 0);
      setForm((prev) => ({ ...prev, amount: computed || "" }));
    }
  }, [form.hoursTaught, form.ratePerHour, amountTouched]);

  useEffect(() => {
    if (!form.lecturer) {
      setAssignments([]);
      setForm((prev) => ({ ...prev, selectedAssignment: "" }));
      return;
    }

    async function loadAssignments() {
      try {
        const res = await fetch(
          `/api/subject-assignments?lecturerId=${form.lecturer}`,
          { credentials: "include" },
        );
        if (res.ok) {
          const data = await res.json();
          setAssignments(data.assignments || []);
        }
      } catch (err) {
        console.error("Failed to load subject assignments", err);
      }
    }

    loadAssignments();
  }, [form.lecturer]);

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesBatch =
      !form.batch ||
      (assignment.batchId?._id || assignment.batchId) === form.batch;
    const matchesSemester =
      !form.semester ||
      Number(assignment.semesterNumber) === Number(form.semester);
    return matchesBatch && matchesSemester;
  });

  function updateField(field, value) {
    setForm((prev) => {
      if (field === "batch" || field === "semester") {
        return {
          ...prev,
          [field]: value,
          selectedAssignment: "",
          subject:
            field === "batch" || field === "semester" ? "" : prev.subject,
        };
      }
      return { ...prev, [field]: value };
    });
  }

  function handleAssignmentSelect(selectedId) {
    const assignment = assignments.find((a) => a._id === selectedId);
    if (assignment) {
      setForm((prev) => ({
        ...prev,
        selectedAssignment: selectedId,
        subject: assignment.subjectId?._id || assignment.subjectId,
        batch: assignment.batchId?._id || assignment.batchId,
        semester: assignment.semesterNumber,
      }));
      return;
    }

    const subject = subjects.find((s) => s._id === selectedId);
    if (subject) {
      setForm((prev) => ({
        ...prev,
        selectedAssignment: "",
        subject: subject._id,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, selectedAssignment: "", subject: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.lecturer || !form.batch || !form.subject || !form.semester) {
      setError("Please fill in lecturer, batch, subject and semester.");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing ? `/api/payments/${payment._id}` : "/api/payments";
      const method = isEditing ? "PATCH" : "POST";

      const body = {
        lecturer: form.lecturer,
        batch: form.batch,
        subject: form.subject,
        semester: Number(form.semester),
        hoursTaught: Number(form.hoursTaught || 0),
        ratePerHour: Number(form.ratePerHour || 0),
        amount: Number(form.amount || 0),
        status: form.status,
        paymentDate:
          form.status === "paid" ? form.paymentDate || new Date() : null,
        referenceNo: form.referenceNo,
        remarks: form.remarks,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save payment record");
      }
    } catch (err) {
      console.error("Failed to save payment", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const subjectOptions = filteredAssignments.length
    ? filteredAssignments.map((assignment) => ({
        id: assignment._id,
        subjectId: assignment.subjectId?._id || assignment.subjectId,
        label: `${assignment.subjectId?.name || "Unknown"} (${assignment.subjectId?.code || ""}) — ${assignment.batchId?.name || "Batch"} / Sem ${assignment.semesterNumber}`,
      }))
    : subjects.map((s) => ({
        id: s._id,
        subjectId: s._id,
        label: `${s.name} (${s.code})`,
      }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">
            {isEditing ? "Edit Payment Record" : "Add Payment Record"}
          </h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Visiting Lecturer
            </label>
            <select
              value={form.lecturer}
              onChange={(e) => updateField("lecturer", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              disabled={isEditing}
            >
              <option value="">Select lecturer</option>
              {lecturers.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Batch
              </label>
              <select
                value={form.batch}
                onChange={(e) => updateField("batch", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Semester
              </label>
              <input
                type="number"
                min="1"
                value={form.semester}
                onChange={(e) => updateField("semester", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Subject
            </label>
            <select
              value={form.selectedAssignment || form.subject}
              onChange={(e) => handleAssignmentSelect(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              disabled={!form.lecturer || !form.batch || !form.semester}
            >
              <option value="">Select subject</option>
              {subjectOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.lecturer &&
              form.batch &&
              form.semester &&
              filteredAssignments.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  No assigned subjects found for this lecturer, batch and
                  semester.
                </p>
              )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Hours Taught
              </label>
              <input
                type="number"
                min="0"
                value={form.hoursTaught}
                onChange={(e) => updateField("hoursTaught", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Rate/hr (Rs.)
              </label>
              <input
                type="number"
                min="0"
                value={form.ratePerHour}
                onChange={(e) => updateField("ratePerHour", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Amount (Rs.)
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => {
                  setAmountTouched(true);
                  updateField("amount", e.target.value);
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {form.status === "paid" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Reference No. (bank slip / cheque no.)
              </label>
              <input
                type="text"
                value={form.referenceNo}
                onChange={(e) => updateField("referenceNo", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                placeholder="e.g. TXN-00231"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Remarks (optional)
            </label>
            <textarea
              value={form.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-sm font-medium text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-lg py-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
