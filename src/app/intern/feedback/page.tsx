"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useMutation } from "@apollo/client/react";
import { SUBMIT_FEEDBACK } from "@/lib/graphql";
import { Star, Send } from "lucide-react";

export default function InternFeedbackPage() {
  const intern = useSelector((state: RootState) => state.intern);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [submitFeedback] = useMutation(SUBMIT_FEEDBACK);

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
      setMessage("");
      setRating(0);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="intern-page">

      <div className="intern-feedback-page-header">
        <h1 className="intern-page-title">Share Your Feedback</h1>
      </div>

      <div className="intern-card intern-feedback-form-card">

        {submitted && (
          <div className="intern-success-msg">
            Feedback submitted successfully! Thank you.
          </div>
        )}

        <form onSubmit={handleSubmit} className="intern-form">

          {/* Star rating */}
          <div className="intern-form-group">
            <label className="intern-form-label">Rate Your Experience</label>
            <div className="intern-star-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="intern-star-btn"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={32}
                    fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                    color={(hoverRating || rating) >= star ? "#f59e0b" : "#d1d5db"}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="intern-form-group">
            <label className="intern-form-label">Your Message</label>
            <textarea
              className="intern-textarea"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think about the program, your department, or any suggestions you have..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !rating}
            className="intern-submit-btn"
          >
            <Send size={16} />
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>

        </form>
      </div>
    </div>
  );
}
