"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import TopHeader from "@/components/TopHeader";
import { useBatches } from "@/hooks/useBatches";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const COLORS = [
  "bg-blue-100   text-blue-800",
  "bg-green-100  text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100   text-pink-800",
  "bg-teal-100   text-teal-800",
];
const SEMESTER_OPTIONS = [1, 2];
const ROW_HEIGHT = 76;

export default function StudentTimetablePage() {
  const { data: session, status } = useSession();
  const { batches } = useBatches();

  const [selLevel, setSelLevel] = useState("");
  const [selSemester, setSelSemester] = useState("");
  const [slots, setSlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  const batchId = session?.user?.batchId;
  const selBatchObj = batches.find((b) => b._id === batchId);

  // BCS only Level 1, BSc Level 1-2
  const levels =
    selBatchObj?.programme === "BSc"
      ? [1, 2]
      : selBatchObj?.programme === "BCS"
        ? [1]
        : [];

  // derived absolute semester number
  const semesterNumber =
    selLevel && selSemester
      ? (Number(selLevel) - 1) * 2 + Number(selSemester)
      : null;

  const currentYear = new Date().getFullYear();

  // color map per assignment
  const colorMap = {};
  assignments.forEach((a, i) => {
    colorMap[a._id] = COLORS[i % COLORS.length];
  });

  // auto-select level 1 once batch loads
  useEffect(() => {
    if (levels.length > 0 && !selLevel) setSelLevel("1");
  }, [levels.length]);

  // fetch timetable + assignments when level+semester selected
  useEffect(() => {
    if (!batchId || !semesterNumber) return;
    setLoading(true);

    Promise.all([
      fetch(
        `/api/timetable?batchId=${batchId}&semesterNumber=${semesterNumber}&year=${currentYear}`,
        { credentials: "include" },
      ).then((r) => r.json()),
      fetch(
        `/api/subject-assignments?batchId=${batchId}&semesterNumber=${semesterNumber}`,
        { credentials: "include" },
      ).then((r) => r.json()),
    ])
      .then(([ttData, assignData]) => {
        if (ttData.success && ttData.timetable) {
          const normalized = (ttData.timetable.slots || []).map((s) => ({
            ...s,
            subjectAssignmentId:
              s.subjectAssignmentId?._id || s.subjectAssignmentId,
          }));
          setSlots(normalized);
        } else {
          setSlots([]);
        }
        if (assignData.success) setAssignments(assignData.assignments || []);
        else setAssignments([]);
      })
      .catch(() => {
        setSlots([]);
        setAssignments([]);
      })
      .finally(() => setLoading(false));
  }, [batchId, semesterNumber]);

  function getAssignment(slotOrId) {
    const id =
      slotOrId?.subjectAssignmentId?._id ||
      slotOrId?.subjectAssignmentId ||
      slotOrId;
    return assignments.find(
      (a) => a._id === id || a._id?.toString() === id?.toString(),
    );
  }

  // merge consecutive same-subject slots
  function getMergedSlots() {
    const merged = [];
    const used = new Set();
    slots.forEach((slot) => {
      if (used.has(`${slot.day}-${slot.startTime}`)) return;
      let endTime = slot.endTime;
      let next = slots.find(
        (s) =>
          s.day === slot.day &&
          s.startTime === endTime &&
          (s.subjectAssignmentId?._id || s.subjectAssignmentId) ===
            (slot.subjectAssignmentId?._id || slot.subjectAssignmentId),
      );
      while (next) {
        used.add(`${next.day}-${next.startTime}`);
        endTime = next.endTime;
        next = slots.find(
          (s) =>
            s.day === slot.day &&
            s.startTime === endTime &&
            (s.subjectAssignmentId?._id || s.subjectAssignmentId) ===
              (slot.subjectAssignmentId?._id || slot.subjectAssignmentId),
        );
      }
      used.add(`${slot.day}-${slot.startTime}`);
      merged.push({ ...slot, endTime });
    });
    return merged;
  }

  const mergedSlots = getMergedSlots();
  const timelineHeight = (TIMES.length - 1) * ROW_HEIGHT;
  const timetableRef = useRef(null);

  // Print-based download — opens new tab and triggers browser print/save as PDF
  function handleDownload() {
    const printContent = timetableRef.current;
    if (!printContent) return;

    const colorStyleMap = {
      "bg-blue-100   text-blue-800": { bg: "#dbeafe", text: "#1e40af" },
      "bg-green-100  text-green-800": { bg: "#dcfce7", text: "#166534" },
      "bg-purple-100 text-purple-800": { bg: "#f3e8ff", text: "#6b21a8" },
      "bg-orange-100 text-orange-800": { bg: "#ffedd5", text: "#9a3412" },
      "bg-pink-100   text-pink-800": { bg: "#fce7f3", text: "#9d174d" },
      "bg-teal-100   text-teal-800": { bg: "#ccfbf1", text: "#115e59" },
    };

    const assignmentRows = assignments
      .map((a, i) => {
        const colors = colorStyleMap[COLORS[i % COLORS.length]] || {
          bg: "#f3f4f6",
          text: "#111827",
        };
        const slotsList = getMergedSlots()
          .filter(
            (s) =>
              (s.subjectAssignmentId?._id || s.subjectAssignmentId) === a._id,
          )
          .map(
            (s) =>
              `${s.day} ${s.startTime}–${s.endTime}${s.location ? " @ " + s.location : ""}`,
          )
          .join(", ");

        return `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">
            <span style="background:${colors.bg};color:${colors.text};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">
              ${a.subjectId?.code}
            </span>
          </td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;">${a.subjectId?.name || ""}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;">${a.lecturerId?.name || "—"}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;">${slotsList || "—"}</td>
        </tr>
      `;
      })
      .join("");

    const gridRows = TIMES.slice(0, -1)
      .map((time) => {
        const cells = DAYS.map((day) => {
          const slot = getMergedSlots().find(
            (s) => s.day === day && s.startTime === time,
          );
          if (!slot)
            return `<td style="padding:6px;border:1px solid #e5e7eb;min-width:100px;height:40px;"></td>`;

          const isCovered = getMergedSlots().some(
            (s) =>
              s.day === day &&
              TIMES.indexOf(s.startTime) < TIMES.indexOf(time) &&
              TIMES.indexOf(s.endTime) > TIMES.indexOf(time),
          );
          if (isCovered) return "";

          const assignment = assignments.find(
            (a) =>
              a._id ===
                (slot.subjectAssignmentId?._id || slot.subjectAssignmentId) ||
              a._id?.toString() ===
                (
                  slot.subjectAssignmentId?._id || slot.subjectAssignmentId
                )?.toString(),
          );
          const assignIdx = assignments.indexOf(assignment);
          const colors = colorStyleMap[COLORS[assignIdx % COLORS.length]] || {
            bg: "#f3f4f6",
            text: "#111827",
          };
          const span = Math.max(
            1,
            TIMES.indexOf(slot.endTime) - TIMES.indexOf(slot.startTime),
          );

          return `
          <td rowspan="${span}" style="padding:6px;border:1px solid #e5e7eb;min-width:100px;vertical-align:top;">
            <div style="background:${colors.bg};color:${colors.text};border-radius:6px;padding:4px 6px;font-size:11px;">
              <div style="font-weight:700;">${assignment?.subjectId?.code || ""}</div>
              <div style="font-size:10px;">${slot.startTime}–${slot.endTime}</div>
              ${assignment?.lecturerId?.name ? `<div style="font-size:10px;font-weight:600;">${assignment.lecturerId.name}</div>` : ""}
              ${slot.location ? `<div style="font-size:10px;opacity:0.7;">${slot.location}</div>` : ""}
            </div>
          </td>
        `;
        }).join("");
        return `
        <tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;white-space:nowrap;font-weight:500;">${time}</td>
          ${cells}
        </tr>
      `;
      })
      .join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Timetable — ${selBatchObj?.name} · Level ${selLevel} · Semester ${selSemester}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
            p  { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 28px; }
            th { background: #f9fafb; padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 12px; text-align: left; }
            @media print { body { padding: 12px; } button { display: none; } }
          </style>
        </head>
        <body>
          <h1>${selBatchObj?.name || "My Timetable"}</h1>
          <p>Level ${selLevel} · Semester ${selSemester} · ${currentYear}</p>

          <table>
            <thead>
              <tr>
                <th style="width:60px;">Time</th>
                ${DAYS.map((d) => `<th>${d}</th>`).join("")}
              </tr>
            </thead>
            <tbody>${gridRows}</tbody>
          </table>

          <h2 style="font-size:14px;font-weight:600;margin-bottom:10px;">Subject Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Lecturer</th>
                <th>Slots</th>
              </tr>
            </thead>
            <tbody>${assignmentRows}</tbody>
          </table>

          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close() } }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (status === "loading") {
    return (
      <div>
        <TopHeader title="My Timetable" subtitle="Loading..." />
        <div className="px-8 py-6">
          <p className="text-sm text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopHeader
        title="My Timetable"
        subtitle={
          selBatchObj
            ? `${selBatchObj.name} · ${selBatchObj.programme}`
            : "Weekly class schedule"
        }
      />

      <div className="px-8 py-6">
        {/* Selectors */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <select
            value={selLevel}
            onChange={(e) => {
              setSelLevel(e.target.value);
              setSelSemester("");
            }}
            disabled={levels.length === 0}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          >
            <option value="">— Select level —</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>

          <select
            value={selSemester}
            onChange={(e) => setSelSemester(e.target.value)}
            disabled={!selLevel}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          >
            <option value="">— Select semester —</option>
            {SEMESTER_OPTIONS.map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </select>

          {selBatchObj && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {selBatchObj.name}
            </span>
          )}
        </div>

        {!selLevel || !selSemester ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400">
              Select a level and semester to view your timetable
            </p>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-400">Loading timetable...</p>
        ) : (
          <>
            {/* Subject legend */}
            {assignments.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {assignments.map((a) => (
                  <span
                    key={a._id}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${colorMap[a._id]}`}
                  >
                    {a.subjectId?.code} — {a.subjectId?.name}
                    {a.lecturerId?.name ? ` · ${a.lecturerId.name}` : ""}
                  </span>
                ))}
              </div>
            )}

            {slots.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-sm text-gray-400">
                  No timetable published for this semester yet.
                </p>
              </div>
            ) : (
              <>
                {/* Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div />
                  <div>
                    <button
                      onClick={handleDownload}
                      className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-sm hover:opacity-95"
                    >
                      Download timetable
                    </button>
                  </div>
                </div>
                {/* Timeline grid — read only, no click handlers */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* Day headers */}
                      <div className="grid grid-cols-[64px_repeat(5,1fr)] bg-gray-50 border-b border-gray-300">
                        <div className="px-2 py-3" />
                        {DAYS.map((d) => (
                          <div
                            key={d}
                            className="px-3 py-3 text-xs text-gray-600 font-semibold text-center border-l border-gray-200"
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Time axis + day columns */}
                      <div className="grid grid-cols-[64px_repeat(5,1fr)]">
                        {/* Time gutter */}
                        <div
                          className="relative"
                          style={{ height: timelineHeight }}
                        >
                          {TIMES.map((t, i) => (
                            <div
                              key={t}
                              className="absolute left-0 right-1 text-right text-xs font-medium text-gray-500"
                              style={{ top: i * ROW_HEIGHT - 7 }}
                            >
                              {t}
                            </div>
                          ))}
                        </div>

                        {/* Day columns */}
                        {DAYS.map((day) => (
                          <div
                            key={day}
                            className="relative border-l border-gray-200"
                            style={{ height: timelineHeight }}
                          >
                            {/* Hour gridlines */}
                            {TIMES.map((t, i) => (
                              <div
                                key={t}
                                className="absolute left-0 right-0 border-t border-gray-300"
                                style={{ top: i * ROW_HEIGHT }}
                              />
                            ))}

                            {/* Empty hour cells — no click handler (read only) */}
                            {TIMES.slice(0, -1).map((t, i) => {
                              const covered = mergedSlots.some(
                                (s) =>
                                  s.day === day &&
                                  TIMES.indexOf(s.startTime) <= i &&
                                  TIMES.indexOf(s.endTime) > i,
                              );
                              if (covered) return null;
                              return (
                                <div
                                  key={t}
                                  className="absolute left-0 right-0"
                                  style={{
                                    top: i * ROW_HEIGHT,
                                    height: ROW_HEIGHT,
                                  }}
                                />
                              );
                            })}

                            {/* Slot blocks */}
                            {mergedSlots
                              .filter((s) => s.day === day)
                              .map((slot) => {
                                const assignment = getAssignment(slot);
                                const startIdx = TIMES.indexOf(slot.startTime);
                                const endIdx = TIMES.indexOf(slot.endTime);
                                const span = Math.max(1, endIdx - startIdx);
                                const top = startIdx * ROW_HEIGHT;
                                const height = span * ROW_HEIGHT;
                                const color = assignment
                                  ? colorMap[assignment._id]
                                  : "bg-gray-100 text-gray-700";
                                const isShort = span <= 1;

                                return (
                                  <div
                                    key={`${day}-${slot.startTime}`}
                                    className={`absolute left-1 right-1 rounded-lg px-2 ${color} flex flex-col justify-center overflow-hidden shadow-sm ring-1 ring-black/5 ${isShort ? "py-1" : "py-2 gap-0.5"}`}
                                    style={{ top: top + 2, height: height - 4 }}
                                  >
                                    <div
                                      className={`font-bold leading-tight truncate ${isShort ? "text-xs" : "text-sm"}`}
                                    >
                                      {assignment?.subjectId?.code}
                                    </div>
                                    <div
                                      className={`font-medium leading-tight truncate ${isShort ? "text-[10px]" : "text-xs"}`}
                                    >
                                      {assignment?.subjectId?.name}
                                    </div>
                                    <div
                                      className={`leading-tight ${isShort ? "text-[10px]" : "text-xs"}`}
                                    >
                                      {slot.startTime}–{slot.endTime}
                                    </div>
                                    {!isShort &&
                                      assignment?.lecturerId?.name && (
                                        <div className="text-xs font-medium leading-tight truncate">
                                          {assignment.lecturerId.name}
                                        </div>
                                      )}
                                    {!isShort && slot.location && (
                                      <div className="text-xs leading-tight truncate opacity-70">
                                        {slot.location}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Your timetable is read-only. Contact your coordinator for any
                  changes.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
