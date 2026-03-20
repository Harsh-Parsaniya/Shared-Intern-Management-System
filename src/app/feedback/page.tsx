"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_FEEDBACK, SUBMIT_FEEDBACK, FeedbackData, Feedback } from "@/lib/graphql";
import { 
  MessageSquare, 
  Star, 
  Send, 
  User, 
  Calendar,
  Quote,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FeedbackPage() {
  const [role, setRole] = useState<string>("intern");
  const [userId, setUserId] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, error, refetch } = useQuery<FeedbackData>(GET_FEEDBACK);
  const [submitFeedback] = useMutation(SUBMIT_FEEDBACK);

  useEffect(() => {
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return '';
      };
  
      const token = getCookie('auth-token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setRole(payload.role || "intern");
          setUserId(payload.userId || "");
        } catch {
          setRole("intern");
        }
      }
  }, []);

  async function handleSubmit() {
    if (!rating || !message) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        variables: {
          internId: userId, // In a real app, this should match the intern's UUID
          message,
          rating
        }
      });
      setMessage("");
      setRating(0);
      refetch();
      alert("Feedback submitted successfully!");
    } catch (err: unknown) {
      alert(`Error submitting feedback: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      </MainLayout>
    );
  }

  const feedbackList = data?.feedback || [];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Feedback & Reviews
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {role === 'intern' 
              ? "Tell us about your internship experience." 
              : "Review anonymous feedback from your interns."}
          </p>
        </div>

        {role === 'intern' ? (
          /* Intern View: Submission Form */
          <div className="max-w-2xl bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/40">
             <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                 <MessageSquare size={24} />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Share Your Thoughts</h3>
                 <p className="text-sm text-slate-400">Your feedback helps us improve the program.</p>
               </div>
             </div>

             <form className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Overall Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={cn(
                          "p-2 rounded-xl transition-all border",
                          rating >= star 
                            ? "bg-amber-50 border-amber-200 text-amber-500" 
                            : "bg-slate-50 border-slate-200 text-slate-300 hover:border-amber-200"
                        )}
                      >
                        <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Your Message</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your experience, challenges, and what you've learned..."
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send size={18} className="mr-2" />}
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
             </form>
          </div>
        ) : (
          /* Admin/Department View: Feedback List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbackList.map((fb: Feedback) => (
              <div 
                key={fb.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="absolute top-6 right-6 text-slate-100 group-hover:text-indigo-50 transition-colors">
                  <Quote size={40} />
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} 
                    />
                  ))}
                </div>

                <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                  &quot;{fb.message}&quot;
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        <User size={14} />
                     </div>
                     <span className="text-xs font-bold text-slate-700">{fb.intern?.user?.name || "Anonymous"}</span>
                   </div>
                   <div className="flex items-center gap-1 text-slate-400">
                     <Calendar size={12} />
                     <span className="text-[10px] font-bold">{new Date(fb.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

