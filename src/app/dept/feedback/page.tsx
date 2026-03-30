"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_INTERNS, GET_FEEDBACK, SUBMIT_FEEDBACK } from "@/lib/graphql";
import { MessageSquare, Star, Send, User, Calendar, Quote } from "lucide-react";

export default function DeptFeedbackPage() {
  const { deptId } = useSelector((state: RootState) => state.dept);

  const [selectedInternId, setSelectedInternId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: internsData } = useQuery<any>(GET_INTERNS);
  const { data: feedbackData, refetch } = useQuery<any>(GET_FEEDBACK);
  const [submitFeedback] = useMutation(SUBMIT_FEEDBACK);

  // Only interns from this department
  const deptInterns = (internsData?.interns || []).filter((i: any) => i.department_id === deptId);

  // Recent feedback from this department
  const allFeedback = feedbackData?.feedback || [];
  const deptFeedback = allFeedback.filter((fb: any) => fb.intern.department_id === deptId);

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
      setSelectedInternId("");
      setRating(0);
      setMessage("");
      setSubmitted(true);
      refetch();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dept-page">

      <div>
        <h1 className="dept-page-title">Feedback &amp; Reviews</h1>
        <p className="dept-page-subtitle">Review anonymous feedback from your interns.</p>
      </div>

      {/* Submit form card */}
      <div className="dept-card dept-feedback-form-card">

        {/* Card header */}
        <div className="dept-form-header">
          <div className="dept-form-header-icon">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="dept-form-header-title">Evaluate an Intern</h3>
            <p className="dept-form-header-sub">Provide feedback for an intern in your department.</p>
          </div>
        </div>

        {submitted && (
          <div className="dept-success-msg">Feedback submitted successfully!</div>
        )}

        <form onSubmit={handleSubmit} className="dept-form">

          {/* Intern dropdown */}
          <div className="dept-form-group">
            <label className="dept-form-label">
              <User size={14} /> Select Intern
            </label>
            <select
              className="dept-select"
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
            >
              <option value="">Select an intern...</option>
              {deptInterns.map((intern: any) => (
                <option key={intern.id} value={intern.id}>
                  {intern.user.name} - {intern.college_name}
                </option>
              ))}
            </select>
          </div>

          {/* Star rating */}
          <div className="dept-form-group">
            <label className="dept-form-label">Overall Rating</label>
            <div className="dept-star-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="dept-star-btn"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={28}
                    fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                    color={(hoverRating || rating) >= star ? "#f59e0b" : "#d1d5db"}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="dept-form-group">
            <label className="dept-form-label">Your Message</label>
            <textarea
              className="dept-textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe intern's performance, strengths, and areas for improvement..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedInternId || !rating}
            className="dept-submit-btn"
          >
            <Send size={16} />
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>

        </form>
      </div>

      {/* Recent feedback from department */}
      <div>
        <h2 className="dept-recent-title">
          <MessageSquare size={20} />
          Recent Feedback from your Department
        </h2>

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

              <p className="dept-feedback-card-msg">{fb.message}</p>

              <div className="dept-feedback-card-footer">
                <div className="dept-feedback-intern-info">
                  <div className="dept-feedback-intern-avatar">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="dept-feedback-intern-name">{fb.intern.user.name}</p>
                    <p className="dept-feedback-intern-dept">{fb.intern.department?.name}</p>
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
      </div>

    </div>
  );
}
