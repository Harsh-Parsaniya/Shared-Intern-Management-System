"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_INTERN_TASKS, GET_TASK_COMMENTS,
  UPDATE_ASSIGNMENT_STATUS, ADD_TASK_COMMENT,
} from "@/lib/graphql";
import { Calendar, Loader2, X, Send, ChevronRight } from "lucide-react";

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: "#fef2f2", text: "#dc2626", border: "#dc2626" },
  medium: { bg: "#fffbeb", text: "#d97706", border: "#d97706" },
  low:    { bg: "#f0fdf4", text: "#16a34a", border: "#16a34a" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:     { bg: "#f1f5f9", text: "#475569" },
  in_progress: { bg: "#dbeafe", text: "#1d4ed8" },
  completed:   { bg: "#d1fae5", text: "#065f46" },
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Completed",
};

const STATUS_NEXT: Record<string, string>       = { pending: "in_progress", in_progress: "completed" };
const STATUS_NEXT_LABEL: Record<string, string> = { pending: "Start Task",  in_progress: "Mark Complete" };

const TABS = ["all", "pending", "in_progress", "completed"] as const;

export default function InternTasksPage() {
  const { internId, userId } = useSelector((state: RootState) => state.intern);

  const [activeTab, setActiveTab]                   = useState<string>("all");
  const [detailAssignment, setDetailAssignment]     = useState<any>(null);
  const [comment, setComment]                       = useState("");
  const [sendingComment, setSendingComment]         = useState(false);
  const [updatingStatus, setUpdatingStatus]         = useState(false);

  const { data, loading, refetch } = useQuery<any>(GET_INTERN_TASKS, {
    variables: { internId },
    skip: !internId,
  });
  const { data: commentsData, refetch: refetchComments } = useQuery<any>(GET_TASK_COMMENTS, {
    variables: { taskId: detailAssignment?.task?.id || "" },
    skip: !detailAssignment?.task?.id,
  });

  const [updateStatus] = useMutation(UPDATE_ASSIGNMENT_STATUS);
  const [addComment]   = useMutation(ADD_TASK_COMMENT);

  const assignments: any[] = data?.task_assignments || [];
  const comments: any[]    = commentsData?.task_comments || [];
  const filtered = activeTab === "all"
    ? assignments
    : assignments.filter((a: any) => a.status === activeTab);

  function openDetail(a: any) {
    setDetailAssignment(a);
    setComment("");
  }

  async function handleUpdateStatus(assignmentId: string, nextStatus: string) {
    setUpdatingStatus(true);
    try {
      await updateStatus({ variables: { id: assignmentId, status: nextStatus } });
      await refetch();
      setDetailAssignment((prev: any) => prev ? { ...prev, status: nextStatus } : null);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !detailAssignment) return;
    setSendingComment(true);
    try {
      await addComment({
        variables: { taskId: detailAssignment.task.id, userId, message: comment.trim() },
      });
      setComment("");
      refetchComments();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setSendingComment(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 900,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px",
  };

  return (
    <div className="intern-page">

      {/* ── Header ── */}
      <div>
        <h1 className="intern-page-title">
          My <span style={{ color: "#4f46e5" }}>Tasks</span>
        </h1>
        <p className="intern-page-subtitle">View and manage tasks assigned to you.</p>
      </div>

      {/* ── Summary pills ── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {(["pending", "in_progress", "completed"] as const).map(tab => {
          const sc = STATUS_COLORS[tab];
          const count = assignments.filter((a: any) => a.status === tab).length;
          return (
            <div key={tab} style={{
              background: sc.bg, color: sc.text,
              padding: "6px 14px", borderRadius: "10px",
              fontSize: "12px", fontWeight: 700,
            }}>
              {STATUS_LABELS[tab]} · {count}
            </div>
          );
        })}
      </div>

      {/* ── Filter tabs ── */}
      <div style={{
        display: "flex", background: "#f1f5f9", borderRadius: "14px",
        padding: "4px", gap: "2px", width: "fit-content",
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", borderRadius: "10px", border: "none",
              fontSize: "12px", fontWeight: 800, cursor: "pointer", transition: "all 0.15s",
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#4f46e5" : "#64748b",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab === "all" ? "All" : STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── Task grid ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 className="animate-spin" size={40} style={{ color: "#4f46e5" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontStyle: "italic" }}>
          {activeTab === "all"
            ? "No tasks assigned to you yet."
            : `No tasks with status "${STATUS_LABELS[activeTab]}".`}
        </div>
      ) : (
        <div className="dept-feedback-grid">
          {filtered.map((a: any) => {
            const task = a.task;
            const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
            const sc = STATUS_COLORS[a.status]         || STATUS_COLORS.pending;
            const isOverdue = new Date(task.deadline) < new Date() && a.status !== "completed";
            const nextStatus = STATUS_NEXT[a.status];
            return (
              <div
                key={a.id}
                style={{
                  background: "#fff", borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${pc.border}`,
                  padding: "20px",
                  transition: "box-shadow 0.15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex", flexDirection: "column", gap: "12px",
                }}
              >
                {/* Priority + Status */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
                  <span style={{
                    background: pc.bg, color: pc.text,
                    fontSize: "10px", fontWeight: 900, padding: "3px 8px",
                    borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {task.priority}
                  </span>
                  <span style={{
                    background: sc.bg, color: sc.text,
                    fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px",
                  }}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </div>

                {/* Title */}
                <p style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", lineHeight: "1.3" }}>
                  {task.title}
                </p>

                {/* Description */}
                {task.description && (
                  <p style={{
                    fontSize: "13px", color: "#64748b", lineHeight: "1.5",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                  }}>
                    {task.description}
                  </p>
                )}

                {/* Department */}
                {task.department && (
                  <span style={{
                    fontSize: "10px", fontWeight: 800, color: "#4f46e5",
                    background: "#ede9fe", padding: "3px 8px", borderRadius: "6px",
                    alignSelf: "flex-start", textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {task.department.name}
                  </span>
                )}

                {/* Deadline */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  color: isOverdue ? "#dc2626" : "#94a3b8",
                  fontSize: "12px", fontWeight: 600,
                }}>
                  <Calendar size={13} />
                  {new Date(task.deadline).toLocaleDateString()}
                  {isOverdue && <span style={{ fontSize: "10px", fontWeight: 800 }}> · OVERDUE</span>}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  {nextStatus && (
                    <button
                      onClick={() => handleUpdateStatus(a.id, nextStatus)}
                      disabled={updatingStatus}
                      style={{
                        flex: 1, padding: "9px", borderRadius: "10px", border: "none",
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        color: "#fff", fontWeight: 700, fontSize: "12px",
                        cursor: "pointer", letterSpacing: "0.03em",
                      }}
                    >
                      {STATUS_NEXT_LABEL[a.status]}
                    </button>
                  )}
                  <button
                    onClick={() => openDetail(a)}
                    style={{
                      flex: nextStatus ? 0 : 1,
                      padding: "9px 14px", borderRadius: "10px",
                      border: "1.5px solid #e2e8f0", background: "#fff",
                      color: "#64748b", fontWeight: 700, fontSize: "12px",
                      cursor: "pointer", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "4px",
                    }}
                  >
                    Details <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════ TASK DETAIL MODAL ══════════════ */}
      {detailAssignment && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)", zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          }}
          onClick={e => { if (e.target === e.currentTarget) setDetailAssignment(null); }}
        >
          <div style={{
            background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "560px",
            padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ flex: 1, paddingRight: "16px" }}>
                {(() => {
                  const pc = PRIORITY_COLORS[detailAssignment.task.priority] || PRIORITY_COLORS.medium;
                  const sc = STATUS_COLORS[detailAssignment.status]           || STATUS_COLORS.pending;
                  return (
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <span style={{ background: pc.bg, color: pc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" as const }}>
                        {detailAssignment.task.priority}
                      </span>
                      <span style={{ background: sc.bg, color: sc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px" }}>
                        {STATUS_LABELS[detailAssignment.status] || detailAssignment.status}
                      </span>
                      {detailAssignment.task.department && (
                        <span style={{ background: "#ede9fe", color: "#4f46e5", fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" as const }}>
                          {detailAssignment.task.department.name}
                        </span>
                      )}
                    </div>
                  );
                })()}
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: "1.3" }}>
                  {detailAssignment.task.title}
                </h3>
              </div>
              <button onClick={() => setDetailAssignment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", flexShrink: 0 }}>
                <X size={20} />
              </button>
            </div>

            {detailAssignment.task.description && (
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
                {detailAssignment.task.description}
              </p>
            )}

            {/* Deadline */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "13px", fontWeight: 600 }}>
              <Calendar size={14} style={{ color: "#4f46e5" }} />
              Deadline: {new Date(detailAssignment.task.deadline).toLocaleDateString()}
            </div>

            {/* Status update */}
            {STATUS_NEXT[detailAssignment.status] && (
              <div style={{ marginBottom: "24px", padding: "16px", background: "#f8fafc", borderRadius: "14px" }}>
                <p style={labelStyle}>Update Your Progress</p>
                <button
                  onClick={() => handleUpdateStatus(detailAssignment.id, STATUS_NEXT[detailAssignment.status])}
                  disabled={updatingStatus}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#fff", fontWeight: 800, fontSize: "13px",
                    cursor: "pointer", letterSpacing: "0.05em",
                  }}
                >
                  {STATUS_NEXT_LABEL[detailAssignment.status]}
                </button>
              </div>
            )}

            {/* Comments */}
            <div>
              <p style={labelStyle}>Discussion ({comments.length})</p>

              <div style={{
                maxHeight: "220px", overflowY: "auto", marginBottom: "12px",
                display: "flex", flexDirection: "column", gap: "10px",
              }}>
                {comments.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>No comments yet. Be the first!</p>
                ) : comments.map((c: any) => (
                  <div key={c.id} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                        {c.user.name}
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "#7c3aed", marginLeft: "6px", textTransform: "capitalize" }}>
                          ({c.user.role})
                        </span>
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>{c.message}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text" value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "12px",
                    border: "1.5px solid #e2e8f0", fontSize: "13px",
                    color: "#0f172a", outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || sendingComment}
                  style={{
                    padding: "10px 16px", borderRadius: "12px", border: "none",
                    background: !comment.trim() ? "#e2e8f0" : "#4f46e5",
                    color: !comment.trim() ? "#94a3b8" : "#fff",
                    cursor: !comment.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
