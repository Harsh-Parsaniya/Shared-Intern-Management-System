"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useMutation, useQuery } from "@apollo/client/react";
import { SUBMIT_FEEDBACK, GET_INTERN_FEEDBACK } from "@/lib/graphql";
import { Star, Send, Plus, X, Calendar, Quote, Loader2 } from "lucide-react";

export default function InternFeedbackPage() {
  const intern = useSelector((state: RootState) => state.intern);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"intern" | "department">("intern");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: feedbackData, loading, refetch } = useQuery(GET_INTERN_FEEDBACK, {
    variables: { internId: intern.internId },
    skip: !intern.internId,
  });

  const [submitFeedback] = useMutation(SUBMIT_FEEDBACK);

  const allFeedback = feedbackData?.feedback || [];
  const feedbackList = allFeedback.filter(
    (fb: any) => (fb.submitted_by_role || "intern") === activeTab
  );

  function openModal() {
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
    if (!rating) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        variables: {
          internId: intern.internId,
          message: message.trim(),
          rating,
          submittedByRole: "intern",
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
    <div className="intern-page">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="intern-page-title">
            Feedback <span style={{ color: "#4f46e5" }}>Archive</span>
          </h1>
          <p className="intern-page-subtitle">Your feedback history and program reviews.</p>
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
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
          {feedbackList.length} {activeTab === "intern" ? "your" : "department"} review{feedbackList.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Feedback list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 className="animate-spin" size={40} style={{ color: "#4f46e5" }} />
        </div>
      ) : feedbackList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontStyle: "italic" }}>
          You haven&apos;t submitted any feedback yet.
        </div>
      ) : (
        <div className="dept-feedback-grid">
          {feedbackList.map((fb: any) => (
            <div key={fb.id} className="dept-feedback-card">
              <div className="dept-feedback-card-top">
                <div className="dept-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} fill={s <= fb.rating ? "#f59e0b" : "none"} color={s <= fb.rating ? "#f59e0b" : "#d1d5db"} />
                  ))}
                </div>
                <span className="dept-quote-icon"><Quote size={36} /></span>
              </div>

              <p className="dept-feedback-card-msg">&quot;{fb.message || "(no message)"}&quot;</p>

              <div className="dept-feedback-card-footer">
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#4f46e5",
                    background: "#ede9fe",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {fb.submitted_by_role === "department" ? "Dept Evaluation" : "Your Review"}
                </span>
                <div className="dept-feedback-date-row">
                  <Calendar size={12} />
                  <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
              padding: "36px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>Share Your Feedback</h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#4f46e5", fontWeight: 700, fontSize: "15px" }}>
                Feedback submitted successfully! Thank you.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

                {/* Star rating */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                    Rate Your Experience
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star
                          size={36}
                          fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                          color={(hoverRating || rating) >= star ? "#f59e0b" : "#d1d5db"}
                          strokeWidth={1.5}
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
                    className="intern-textarea"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think about the program, your department, or any suggestions you have..."
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !rating}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "none",
                    background: !rating ? "#c7d2fe" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: !rating ? "not-allowed" : "pointer",
                    letterSpacing: "0.05em",
                  }}
                >
                  <Send size={15} />
                  {submitting ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
                </button>

              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
