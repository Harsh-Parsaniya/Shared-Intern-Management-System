"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_INTERNS, GET_FEEDBACK, SUBMIT_FEEDBACK } from "@/lib/graphql";
import { MessageSquare, Star, Send, User, Calendar, Quote, Plus, X, Search } from "lucide-react";

export default function DeptFeedbackPage() {
  const { deptId } = useSelector((state: RootState) => state.dept);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInternId, setSelectedInternId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"intern" | "department">("intern");

  const { data: internsData } = useQuery<any>(GET_INTERNS);
  const { data: feedbackData, refetch } = useQuery<any>(GET_FEEDBACK);
  const [submitFeedback] = useMutation(SUBMIT_FEEDBACK);

  const deptInterns = (internsData?.interns || []).filter((i: any) => i.department_id === deptId);
  const allFeedback = feedbackData?.feedback || [];
  const deptFeedback = allFeedback
    .filter((fb: any) => fb.intern.department_id === deptId)
    .filter((fb: any) => (fb.submitted_by_role || "intern") === activeTab)
    .filter((fb: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        fb.message.toLowerCase().includes(q) ||
        fb.intern.user.name.toLowerCase().includes(q)
      );
    });

  function openModal() {
    setSelectedInternId("");
    setRating(0);
    setHoverRating(0);
    setMessage("");
    setSubmitted(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInternId || !rating) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        variables: {
          internId: selectedInternId,
          message: message.trim(),
          rating,
          submittedByRole: "department",
        },
      });
      setSubmitted(true);
      refetch();
      setTimeout(() => {
        setSubmitted(false);
        closeModal();
      }, 1500);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dept-page">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dept-page-title">
            Feedback <span style={{ color: "#4f46e5" }}>Archive</span>
          </h1>
          <p className="dept-page-subtitle">Comprehensive review of program and department feedback.</p>
        </div>
        <button
          onClick={openModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "14px",
            padding: "12px 22px",
            fontWeight: 800,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
          }}
        >
          <Plus size={16} />
          Give Feedback
        </button>
      </div>

      {/* Intern / Department tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "14px", padding: "4px", gap: "2px" }}>
          <button
            onClick={() => setActiveTab("intern")}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: "none",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s",
              background: activeTab === "intern" ? "#fff" : "transparent",
              color: activeTab === "intern" ? "#4f46e5" : "#64748b",
              boxShadow: activeTab === "intern" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Intern
          </button>
          <button
            onClick={() => setActiveTab("department")}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: "none",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s",
              background: activeTab === "department" ? "#fff" : "transparent",
              color: activeTab === "department" ? "#4f46e5" : "#64748b",
              boxShadow: activeTab === "department" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Department
          </button>
        </div>
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
          {deptFeedback.length} {activeTab === "intern" ? "intern" : "department"} review{deptFeedback.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", maxWidth: "600px" }}>
        <Search
          size={16}
          style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
        />
        <input
          type="text"
          placeholder="Search feedback archives..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            paddingLeft: "44px",
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            background: "#fff",
            fontSize: "14px",
            color: "#334155",
            outline: "none",
          }}
        />
      </div>

      {/* Feedback grid */}
      <div className="dept-feedback-grid">
        {deptFeedback.map((fb: any) => (
          <div key={fb.id} className="dept-feedback-card">
            <div className="dept-feedback-card-top">
              <div className="dept-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill={s <= fb.rating ? "#f59e0b" : "none"} color={s <= fb.rating ? "#f59e0b" : "#d1d5db"} />
                ))}
              </div>
              <span className="dept-quote-icon">
                <Quote size={36} />
              </span>
            </div>

            <p className="dept-feedback-card-msg">&quot;{fb.message}&quot;</p>

            <div className="dept-feedback-card-footer">
              <div className="dept-feedback-intern-info">
                <div className="dept-feedback-intern-avatar">
                  <User size={14} />
                </div>
                <div>
                  <p className="dept-feedback-intern-name">{fb.intern.user.name}</p>
                  <p className="dept-feedback-intern-dept" style={{ textTransform: "uppercase", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", color: (fb.submitted_by_role || "intern") === "department" ? "#7c3aed" : "#4f46e5" }}>
                    {(fb.submitted_by_role || "intern") === "department" ? "Dept Evaluation" : "Intern"}
                  </p>
                </div>
              </div>
              <div className="dept-feedback-date-row">
                <Calendar size={12} />
                <span>{new Date(fb.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {deptFeedback.length === 0 && (
          <p className="dept-empty-text">No feedback from this department yet.</p>
        )}
      </div>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "520px",
              padding: "32px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#ede9fe", borderRadius: "12px", padding: "8px", color: "#4f46e5", display: "flex" }}>
                  <MessageSquare size={20} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Evaluate an Intern</h3>
              </div>
              <button
                onClick={closeModal}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#4f46e5", fontWeight: 700, fontSize: "15px" }}>
                Feedback submitted successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Intern select */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    <User size={13} /> Select Intern
                  </label>
                  <select
                    className="dept-select"
                    value={selectedInternId}
                    onChange={(e) => setSelectedInternId(e.target.value)}
                    required
                  >
                    <option value="">Select an intern...</option>
                    {deptInterns.map((intern: any) => (
                      <option key={intern.id} value={intern.id}>
                        {intern.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Star rating */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                    Overall Rating
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        style={{
                          background: "none",
                          border: "1.5px solid",
                          borderColor: (hoverRating || rating) >= star ? "#f59e0b" : "#e2e8f0",
                          borderRadius: "10px",
                          padding: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star
                          size={24}
                          fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                          color={(hoverRating || rating) >= star ? "#f59e0b" : "#d1d5db"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Your Message
                  </label>
                  <textarea
                    className="dept-textarea"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe intern's performance, strengths, and areas for improvement..."
                  />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontWeight: 800,
                      fontSize: "13px",
                      color: "#64748b",
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedInternId || !rating}
                    style={{
                      flex: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "none",
                      background: !selectedInternId || !rating ? "#c7d2fe" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "13px",
                      cursor: !selectedInternId || !rating ? "not-allowed" : "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <Send size={14} />
                    {submitting ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
