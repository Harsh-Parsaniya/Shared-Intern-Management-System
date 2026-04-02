"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ALL_TASKS, GET_TASK_COMMENTS, GET_DEPARTMENTS } from "@/lib/graphql";
import { MainLayout } from "@/components/layout/main-layout";
import { Calendar, Users, Loader2, X, Search } from "lucide-react";

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: "#fef2f2", text: "#dc2626", border: "#dc2626" },
  medium: { bg: "#fffbeb", text: "#d97706", border: "#d97706" },
  low:    { bg: "#f0fdf4", text: "#16a34a", border: "#16a34a" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:     { bg: "#f1f5f9", text: "#475569" },
  in_progress: { bg: "#dbeafe", text: "#1d4ed8" },
  completed:   { bg: "#d1fae5", text: "#065f46" },
  reviewed:    { bg: "#ede9fe", text: "#5b21b6" },
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Completed",
  reviewed:    "Reviewed",
};

const TABS = ["all", "pending", "in_progress", "completed", "reviewed"] as const;

export default function AdminTasksPage() {
  const [activeTab, setActiveTab]       = useState<string>("all");
  const [deptFilter, setDeptFilter]     = useState<string>("all");
  const [searchQuery, setSearchQuery]   = useState<string>("");
  const [detailTask, setDetailTask]     = useState<any>(null);

  const { data: tasksData, loading }    = useQuery<any>(GET_ALL_TASKS);
  const { data: deptData }              = useQuery<any>(GET_DEPARTMENTS);
  const { data: commentsData }          = useQuery<any>(GET_TASK_COMMENTS, {
    variables: { taskId: detailTask?.id || "" },
    skip: !detailTask?.id,
  });

  const tasks: any[]       = tasksData?.tasks || [];
  const departments: any[] = deptData?.departments || [];
  const comments: any[]    = commentsData?.task_comments || [];

  const filtered = tasks
    .filter((t: any) => activeTab === "all" || t.status === activeTab)
    .filter((t: any) => deptFilter === "all" || t.department?.id === deptFilter)
    .filter((t: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.department?.name || "").toLowerCase().includes(q)
      );
    });

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 900,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px",
  };

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Tasks <span className="text-indigo-600">Overview</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Read-only view of all tasks across departments.
          </p>
        </div>

        {/* ── Search + Dept filter ── */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", paddingLeft: "42px", paddingRight: "14px",
                paddingTop: "11px", paddingBottom: "11px",
                borderRadius: "14px", border: "1px solid #e2e8f0",
                background: "#fff", fontSize: "14px", color: "#334155",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            style={{
              padding: "11px 14px", borderRadius: "14px",
              border: "1px solid #e2e8f0", background: "#fff",
              fontSize: "14px", color: "#334155", outline: "none", fontWeight: 600,
            }}
          >
            <option value="all">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* ── Summary pills ── */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {(["pending", "in_progress", "completed", "reviewed"] as const).map(tab => {
            const sc    = STATUS_COLORS[tab];
            const count = tasks.filter((t: any) => t.status === tab).length;
            return (
              <div key={tab} style={{ background: sc.bg, color: sc.text, padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 700 }}>
                {STATUS_LABELS[tab]} · {count}
              </div>
            );
          })}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "14px", padding: "4px", gap: "2px", width: "fit-content" }}>
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

        {/* ── Tasks grid ── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 className="animate-spin" size={40} style={{ color: "#4f46e5" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontStyle: "italic" }}>
            No tasks found for the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((task: any) => {
              const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
              const sc = STATUS_COLORS[task.status]     || STATUS_COLORS.pending;
              const isOverdue = new Date(task.deadline) < new Date() && task.status !== "completed" && task.status !== "reviewed";
              return (
                <div
                  key={task.id}
                  onClick={() => setDetailTask(task)}
                  style={{
                    background: "#fff", borderRadius: "20px",
                    border: "1px solid #e2e8f0",
                    borderLeft: `4px solid ${pc.border}`,
                    padding: "20px", cursor: "pointer",
                    transition: "box-shadow 0.15s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    display: "flex", flexDirection: "column", gap: "10px",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")}
                >
                  {/* Priority + Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
                    <span style={{ background: pc.bg, color: pc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {task.priority}
                    </span>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px" }}>
                      {STATUS_LABELS[task.status] || task.status}
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

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: isOverdue ? "#dc2626" : "#94a3b8", fontSize: "12px", fontWeight: 600 }}>
                      <Calendar size={13} />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>
                      <Users size={13} />
                      {task.task_assignments.length} intern{task.task_assignments.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════ TASK DETAIL MODAL ══════════════ */}
        {detailTask && (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
              backdropFilter: "blur(4px)", zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
            }}
            onClick={e => { if (e.target === e.currentTarget) setDetailTask(null); }}
          >
            <div style={{
              background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "600px",
              padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              maxHeight: "90vh", overflowY: "auto",
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div style={{ flex: 1, paddingRight: "16px" }}>
                  {(() => {
                    const pc = PRIORITY_COLORS[detailTask.priority] || PRIORITY_COLORS.medium;
                    const sc = STATUS_COLORS[detailTask.status]     || STATUS_COLORS.pending;
                    return (
                      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <span style={{ background: pc.bg, color: pc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" as const }}>
                          {detailTask.priority}
                        </span>
                        <span style={{ background: sc.bg, color: sc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px" }}>
                          {STATUS_LABELS[detailTask.status] || detailTask.status}
                        </span>
                        {detailTask.department && (
                          <span style={{ background: "#ede9fe", color: "#4f46e5", fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" as const }}>
                            {detailTask.department.name}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: "1.3" }}>
                    {detailTask.title}
                  </h3>
                </div>
                <button onClick={() => setDetailTask(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", flexShrink: 0 }}>
                  <X size={20} />
                </button>
              </div>

              {detailTask.description && (
                <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
                  {detailTask.description}
                </p>
              )}

              {/* Deadline */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "13px", fontWeight: 600 }}>
                <Calendar size={14} style={{ color: "#4f46e5" }} />
                Deadline: {new Date(detailTask.deadline).toLocaleDateString()}
              </div>

              {/* Assigned interns with statuses */}
              <div style={{ marginBottom: "24px" }}>
                <p style={labelStyle}>Assigned Interns ({detailTask.task_assignments.length})</p>
                {detailTask.task_assignments.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>No interns assigned.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {detailTask.task_assignments.map((a: any) => {
                      const asc = STATUS_COLORS[a.status] || STATUS_COLORS.pending;
                      return (
                        <div key={a.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 14px", background: "#f8fafc", borderRadius: "12px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "32px", height: "32px", borderRadius: "50%",
                              background: "#ede9fe", color: "#4f46e5",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 800, fontSize: "12px", flexShrink: 0,
                            }}>
                              {a.intern.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                              {a.intern.user.name}
                            </span>
                          </div>
                          <span style={{ background: asc.bg, color: asc.text, fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "6px" }}>
                            {STATUS_LABELS[a.status] || a.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comments (read-only for admin) */}
              <div>
                <p style={labelStyle}>Discussion ({comments.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "220px", overflowY: "auto" }}>
                  {comments.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>No comments yet.</p>
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
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
