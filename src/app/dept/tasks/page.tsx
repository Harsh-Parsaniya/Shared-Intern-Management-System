"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_DEPT_TASKS, GET_INTERNS, GET_TASK_COMMENTS,
  CREATE_TASK, UPDATE_TASK_STATUS, ADD_TASK_COMMENT,
  ADD_TASK_ASSIGNMENT, REMOVE_TASK_ASSIGNMENT, DELETE_TASK,
} from "@/lib/graphql";
import {
  Plus, X, Calendar, Users, Loader2, Send, ClipboardList, UserPlus, Trash2,
} from "lucide-react";

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

export default function DeptTasksPage() {
  const { deptId, userId } = useSelector((state: RootState) => state.dept);

  // Modal state
  const [newTaskOpen, setNewTaskOpen]   = useState(false);
  const [detailTask, setDetailTask]     = useState<any>(null);
  const [activeTab, setActiveTab]       = useState<string>("all");

  // New task form
  const [title, setTitle]               = useState("");
  const [description, setDescription]  = useState("");
  const [deadline, setDeadline]         = useState("");
  const [priority, setPriority]         = useState("medium");
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [creating, setCreating]         = useState(false);

  // Detail modal state
  const [newStatus, setNewStatus]       = useState("");
  const [comment, setComment]           = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [assignInternId, setAssignInternId] = useState("");
  const [assigning, setAssigning]           = useState(false);

  // Queries
  const { data: tasksData, loading, refetch } = useQuery<any>(GET_DEPT_TASKS, {
    variables: { deptId },
    skip: !deptId,
  });
  const { data: internsData } = useQuery<any>(GET_INTERNS);
  const { data: commentsData, refetch: refetchComments } = useQuery<any>(GET_TASK_COMMENTS, {
    variables: { taskId: detailTask?.id || "" },
    skip: !detailTask?.id,
  });

  // Mutations
  const [createTask]           = useMutation(CREATE_TASK);
  const [updateTaskStatus]     = useMutation(UPDATE_TASK_STATUS);
  const [addComment]           = useMutation(ADD_TASK_COMMENT);
  const [addTaskAssignment]    = useMutation(ADD_TASK_ASSIGNMENT);
  const [removeTaskAssignment] = useMutation(REMOVE_TASK_ASSIGNMENT);
  const [deleteTask]           = useMutation(DELETE_TASK);

  const tasks: any[]    = tasksData?.tasks || [];
  const comments: any[] = commentsData?.task_comments || [];
  const deptInterns     = (internsData?.interns || []).filter((i: any) => i.department_id === deptId);
  const filteredTasks   = activeTab === "all" ? tasks : tasks.filter((t: any) => t.status === activeTab);

  function openNewTask() {
    setTitle(""); setDescription(""); setDeadline("");
    setPriority("medium"); setSelectedInterns([]);
    setNewTaskOpen(true);
  }

  function toggleIntern(id: string) {
    setSelectedInterns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function openDetail(task: any) {
    setDetailTask(task);
    setNewStatus(task.status);
    setComment("");
    setAssignInternId("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !deadline) return;
    setCreating(true);
    try {
      await createTask({
        variables: {
          title: title.trim(),
          description: description.trim(),
          deadline,
          priority,
          deptId,
          userId,
          assignments: selectedInterns.map(id => ({ intern_id: id })),
        },
      });
      await refetch();
      setNewTaskOpen(false);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateStatus() {
    if (!detailTask || newStatus === detailTask.status) return;
    try {
      await updateTaskStatus({ variables: { id: detailTask.id, status: newStatus } });
      await refetch();
      setDetailTask((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !detailTask) return;
    setSendingComment(true);
    try {
      await addComment({ variables: { taskId: detailTask.id, userId, message: comment.trim() } });
      setComment("");
      refetchComments();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setSendingComment(false);
    }
  }

  async function handleAssignIntern() {
    if (!assignInternId || !detailTask) return;
    // Prevent duplicate assignment
    const alreadyAssigned = detailTask.task_assignments.some(
      (a: any) => a.intern.id === assignInternId
    );
    if (alreadyAssigned) {
      alert("This intern is already assigned to the task.");
      return;
    }
    setAssigning(true);
    try {
      await addTaskAssignment({ variables: { taskId: detailTask.id, internId: assignInternId } });
      const updated = await refetch();
      // Sync detailTask with fresh data
      const fresh = updated.data?.tasks?.find((t: any) => t.id === detailTask.id);
      if (fresh) setDetailTask({ ...fresh, status: fresh.status });
      setAssignInternId("");
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    if (!confirm("Remove this intern from the task?")) return;
    try {
      await removeTaskAssignment({ variables: { id: assignmentId } });
      const updated = await refetch();
      const fresh = updated.data?.tasks?.find((t: any) => t.id === detailTask?.id);
      if (fresh) setDetailTask({ ...fresh, status: fresh.status });
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    try {
      await deleteTask({ variables: { id: taskId } });
      setDetailTask(null);
      await refetch();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    }
  }

  // ── Shared styles ─────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 900,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "12px",
    border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  };

  // ─────────────────────────────────────────────
  return (
    <div className="dept-page">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="dept-page-title">
            Tasks <span style={{ color: "#4f46e5" }}>Board</span>
          </h1>
          <p className="dept-page-subtitle">Create and manage tasks for your interns.</p>
        </div>
        <button
          onClick={openNewTask}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "#4f46e5", color: "#fff", border: "none",
            borderRadius: "14px", padding: "12px 22px",
            fontWeight: 800, fontSize: "13px", cursor: "pointer",
            boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
          }}
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* ── Summary pills ── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {(["pending", "in_progress", "completed", "reviewed"] as const).map(tab => {
          const sc = STATUS_COLORS[tab];
          const count = tasks.filter((t: any) => t.status === tab).length;
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
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontStyle: "italic" }}>
          {activeTab === "all"
            ? "No tasks yet. Click \"New Task\" to create one."
            : `No tasks with status "${STATUS_LABELS[activeTab]}".`}
        </div>
      ) : (
        <div className="dept-feedback-grid">
          {filteredTasks.map((task: any) => {
            const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
            const sc = STATUS_COLORS[task.status]     || STATUS_COLORS.pending;
            const isOverdue = new Date(task.deadline) < new Date() && task.status !== "completed" && task.status !== "reviewed";
            return (
              <div
                key={task.id}
                onClick={() => openDetail(task)}
                style={{
                  background: "#fff", borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${pc.border}`,
                  padding: "20px", cursor: "pointer",
                  transition: "box-shadow 0.15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  position: "relative",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")}>
                {/* Delete button on card */}
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                  title="Delete task"
                  style={{
                    position: "absolute", top: "12px", right: "12px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#cbd5e1", padding: "4px", borderRadius: "6px",
                    display: "flex", alignItems: "center",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#e11d48")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  <Trash2 size={14} />
                </button>

                {/* Priority + Status row */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", gap: "6px" }}>
                  <span style={{
                    background: pc.bg, color: pc.text,
                    fontSize: "10px", fontWeight: 900, padding: "3px 8px",
                    borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {task.priority}
                  </span>
                  <span style={{
                    background: sc.bg, color: sc.text,
                    fontSize: "10px", fontWeight: 900, padding: "3px 8px",
                    borderRadius: "6px",
                  }}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </div>

                {/* Title */}
                <p style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginBottom: "6px", lineHeight: "1.3" }}>
                  {task.title}
                </p>

                {/* Description */}
                {task.description && (
                  <p style={{
                    fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "14px",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                  }}>
                    {task.description}
                  </p>
                )}

                {/* Footer */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  paddingTop: "12px", borderTop: "1px solid #f1f5f9",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    color: isOverdue ? "#dc2626" : "#94a3b8",
                    fontSize: "12px", fontWeight: 600,
                  }}>
                    <Calendar size={13} />
                    {new Date(task.deadline).toLocaleDateString()}
                    {isOverdue && <span style={{ fontSize: "10px", fontWeight: 800 }}> · OVERDUE</span>}
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

      {/* ══════════════ NEW TASK MODAL ══════════════ */}
      {newTaskOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)", zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          }}
          onClick={e => { if (e.target === e.currentTarget) setNewTaskOpen(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "540px",
            padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#ede9fe", borderRadius: "12px", padding: "8px", color: "#4f46e5", display: "flex" }}>
                  <ClipboardList size={20} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Create New Task</h3>
              </div>
              <button onClick={() => setNewTaskOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>Task Title *</label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  required placeholder="Enter task title..." style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="Describe the task in detail..."
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Deadline */}
              <div>
                <label style={labelStyle}>Deadline *</label>
                <input
                  type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  required min={new Date().toISOString().split("T")[0]} style={inputStyle}
                />
              </div>

              {/* Priority */}
              <div>
                <label style={labelStyle}>Priority</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["low", "medium", "high"] as const).map(p => {
                    const pc = PRIORITY_COLORS[p];
                    return (
                      <button
                        key={p} type="button" onClick={() => setPriority(p)}
                        style={{
                          flex: 1, padding: "8px", borderRadius: "10px",
                          border: `2px solid ${priority === p ? pc.border : "#e2e8f0"}`,
                          background: priority === p ? pc.bg : "#fff",
                          color: priority === p ? pc.text : "#94a3b8",
                          fontSize: "12px", fontWeight: 800, cursor: "pointer",
                          textTransform: "capitalize", transition: "all 0.15s",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign interns */}
              <div>
                <label style={labelStyle}>
                  Assign Interns ({selectedInterns.length} selected)
                </label>
                <div style={{
                  maxHeight: "160px", overflowY: "auto",
                  border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "8px",
                }}>
                  {deptInterns.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "13px", padding: "8px", textAlign: "center" }}>
                      No interns in this department
                    </p>
                  ) : deptInterns.map((intern: any) => (
                    <label
                      key={intern.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                        background: selectedInterns.includes(intern.id) ? "#ede9fe" : "transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedInterns.includes(intern.id)}
                        onChange={() => toggleIntern(intern.id)}
                        style={{ accentColor: "#4f46e5", width: "16px", height: "16px" }}
                      />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                        {intern.user.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button" onClick={() => setNewTaskOpen(false)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "12px",
                    border: "1px solid #e2e8f0", background: "#fff",
                    fontWeight: 800, fontSize: "13px", color: "#64748b",
                    cursor: "pointer", letterSpacing: "0.05em",
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit" disabled={creating || !title || !deadline}
                  style={{
                    flex: 2, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "8px",
                    padding: "12px", borderRadius: "12px", border: "none",
                    background: !title || !deadline ? "#c7d2fe" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#fff", fontWeight: 800, fontSize: "13px",
                    cursor: !title || !deadline ? "not-allowed" : "pointer",
                    letterSpacing: "0.05em",
                  }}
                >
                  <Plus size={14} />
                  {creating ? "CREATING..." : "CREATE TASK"}
                </button>
              </div>

            </form>
          </div>
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
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                  {(() => {
                    const pc = PRIORITY_COLORS[detailTask.priority] || PRIORITY_COLORS.medium;
                    const sc = STATUS_COLORS[detailTask.status]     || STATUS_COLORS.pending;
                    return (
                      <>
                        <span style={{ background: pc.bg, color: pc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                          {detailTask.priority}
                        </span>
                        <span style={{ background: sc.bg, color: sc.text, fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px" }}>
                          {STATUS_LABELS[detailTask.status] || detailTask.status}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: "1.3" }}>
                  {detailTask.title}
                </h3>
              </div>
              <button onClick={() => setDetailTask(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", flexShrink: 0 }}>
                <X size={20} />
              </button>
            </div>

            {/* Delete task button */}
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => handleDeleteTask(detailTask.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "10px",
                  border: "1.5px solid #fecdd3", background: "#fff5f5",
                  color: "#e11d48", fontWeight: 700, fontSize: "12px",
                  cursor: "pointer", letterSpacing: "0.03em",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fecdd3")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff5f5")}
              >
                <Trash2 size={13} />
                Delete Task
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

            {/* Update task status */}
            <div style={{ marginBottom: "24px", padding: "16px", background: "#f8fafc", borderRadius: "14px" }}>
              <p style={labelStyle}>Update Task Status</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: "10px",
                    border: "1.5px solid #e2e8f0", fontSize: "13px", fontWeight: 600,
                    color: "#0f172a", outline: "none", background: "#fff",
                  }}
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={newStatus === detailTask.status}
                  style={{
                    padding: "8px 18px", borderRadius: "10px", border: "none",
                    background: newStatus === detailTask.status ? "#e2e8f0" : "#4f46e5",
                    color: newStatus === detailTask.status ? "#94a3b8" : "#fff",
                    fontWeight: 700, fontSize: "12px",
                    cursor: newStatus === detailTask.status ? "not-allowed" : "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Assigned interns */}
            <div style={{ marginBottom: "24px" }}>
              <p style={labelStyle}>
                Assigned Interns ({detailTask.task_assignments.length})
              </p>

              {/* Add intern row */}
              {(() => {
                const assignedIds = detailTask.task_assignments.map((a: any) => a.intern.id);
                const availableInterns = deptInterns.filter((i: any) => !assignedIds.includes(i.id));
                return availableInterns.length > 0 ? (
                  <div style={{
                    display: "flex", gap: "8px", alignItems: "center",
                    marginBottom: "12px", padding: "12px",
                    background: "#f8fafc", borderRadius: "12px",
                  }}>
                    <select
                      value={assignInternId}
                      onChange={e => setAssignInternId(e.target.value)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: "10px",
                        border: "1.5px solid #e2e8f0", fontSize: "13px", fontWeight: 600,
                        color: "#0f172a", outline: "none", background: "#fff",
                      }}
                    >
                      <option value="">Select intern to assign...</option>
                      {availableInterns.map((intern: any) => (
                        <option key={intern.id} value={intern.id}>{intern.user.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignIntern}
                      disabled={!assignInternId || assigning}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "10px", border: "none",
                        background: !assignInternId ? "#e2e8f0" : "#4f46e5",
                        color: !assignInternId ? "#94a3b8" : "#fff",
                        fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap",
                        cursor: !assignInternId ? "not-allowed" : "pointer",
                      }}
                    >
                      <UserPlus size={13} />
                      {assigning ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                ) : null;
              })()}

              {detailTask.task_assignments.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>No interns assigned yet. Use the selector above to assign one.</p>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            background: asc.bg, color: asc.text,
                            fontSize: "10px", fontWeight: 800, padding: "3px 10px",
                            borderRadius: "6px",
                          }}>
                            {STATUS_LABELS[a.status] || a.status}
                          </span>
                          <button
                            onClick={() => handleRemoveAssignment(a.id)}
                            title="Remove intern from task"
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#e11d48", padding: "4px", borderRadius: "6px",
                              display: "flex", alignItems: "center",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <p style={labelStyle}>Discussion ({comments.length})</p>

              <div style={{
                maxHeight: "220px", overflowY: "auto", marginBottom: "12px",
                display: "flex", flexDirection: "column", gap: "10px",
              }}>
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
