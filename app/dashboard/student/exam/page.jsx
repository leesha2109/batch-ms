"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBatches } from "@/hooks/useBatches";
import TopHeader from "@/components/TopHeader";

const SEMESTER_OPTIONS = [1, 2];

export default function StudentExamPage() {
  const { data: session, status } = useSession();
  const { batches } = useBatches();

  const [selLevel, setSelLevel] = useState("");
  const [selSemester, setSelSemester] = useState("");
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [comments, setComments] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState("");

  const batchId = session?.user?.batchId;
  const batch = batches.find((b) => b._id === batchId);
  const levels =
    batch?.programme === "BSc" ? [1, 2] : batch?.programme === "BCS" ? [1] : [];
  const semesterNumber =
    selLevel && selSemester
      ? (Number(selLevel) - 1) * 2 + Number(selSemester)
      : null;

  useEffect(() => {
    if (!selLevel && levels.length > 0) {
      setSelLevel(String(levels[0]));
      setSelSemester("1");
    }
  }, [levels, selLevel]);

  useEffect(() => {
    if (!batchId || !semesterNumber) return;
    setLoadingTimetable(true);
    setLoadingComments(true);

    fetch(`/api/exam-timetable?batch=${batchId}&semester=${semesterNumber}`)
      .then((res) => res.json())
      .then((data) => {
        setTimetableEntries(data.entries || []);
      })
      .catch(() => setTimetableEntries([]))
      .finally(() => setLoadingTimetable(false));

    fetch(
      `/api/exam-timetable/comments?batch=${batchId}&semester=${semesterNumber}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || []);
      })
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [batchId, semesterNumber]);

  async function handlePostComment() {
    if (!commentText.trim() || !batchId || !semesterNumber) return;
    setPostingComment(true);
    setError("");

    try {
      const res = await fetch("/api/exam-timetable/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: batchId,
          semester: semesterNumber,
          message: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Unable to post comment");
      } else {
        setCommentText("");
        setComments((prev) => [data.comment, ...prev]);
      }
    } catch {
      setError("Unable to post comment");
    } finally {
      setPostingComment(false);
    }
  }

  const selectedSubtitle = batch
    ? `${batch.name} · ${batch.programme}`
    : "Exam timetable and comments";

  return (
    <div>
      <TopHeader title="Exam Timetable" subtitle={selectedSubtitle} />

      <div className="px-8 py-6 space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selLevel}
            onChange={(e) => {
              setSelLevel(e.target.value);
              setSelSemester("");
            }}
            disabled={!levels.length}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          >
            <option value="">— Select level —</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                Level {level}
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
            {SEMESTER_OPTIONS.map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>

          {batch && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {batch.name}
            </span>
          )}
        </div>

        {!batch ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm text-gray-400">
              No batch assigned to your account yet.
            </p>
          </div>
        ) : !selLevel || !selSemester ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm text-gray-400">
              Select a level and semester to see the exam timetable and leave
              comments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-5">
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Exam timetable
                  </h2>
                  <p className="text-xs text-gray-500">
                    This view is read-only for students.
                  </p>
                </div>
                {loadingTimetable ? (
                  <div className="p-8 text-sm text-gray-500">
                    Loading exam timetable…
                  </div>
                ) : timetableEntries.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No exam timetable published yet for this semester.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Subject</th>
                          <th className="px-5 py-3">Time</th>
                          <th className="px-5 py-3">Venue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetableEntries.map((entry) => (
                          <tr
                            key={entry._id}
                            className="border-t border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-5 py-4 text-gray-700">
                              {new Date(entry.examDate).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4 text-gray-700">
                              {entry.subject?.code || "N/A"} —{" "}
                              {entry.subject?.name}
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                              {entry.startTime} — {entry.endTime}
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                              {entry.venue || "TBD"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">
                      Leave a comment
                    </h2>
                    <p className="text-xs text-gray-400">
                      Comments auto-expire after 24 hours.
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                    {comments.length} recent comment
                    {comments.length === 1 ? "" : "s"}
                  </span>
                </div>
                {error && (
                  <div className="mb-3 text-sm text-rose-600">{error}</div>
                )}
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="Share feedback on the exam timetable..."
                  disabled={postingComment}
                />
                <div className="flex items-center justify-between mt-3 gap-3">
                  <p className="text-xs text-gray-400">
                    Your comment will be visible for 24 hours.
                  </p>
                  <button
                    onClick={handlePostComment}
                    disabled={postingComment || !commentText.trim()}
                    className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {postingComment ? "Posting…" : "Post comment"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Recent comments
                </h2>
                {loadingComments ? (
                  <p className="text-sm text-gray-500">Loading comments…</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No comments have been added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment._id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2 text-xs text-gray-500">
                          <span>{comment.studentName}</span>
                          <span>
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {comment.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
