"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery } from "@apollo/client/react";
import { GET_FEEDBACK, FeedbackData, Feedback } from "@/lib/graphql";
import { Star, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FeedbackPage() {
  // "intern" shows feedback submitted by interns, "department" shows feedback submitted by dept managers
  const [activeTab, setActiveTab] = useState<"intern" | "department">("intern");

  const { data, loading } = useQuery<FeedbackData>(GET_FEEDBACK);

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

  // Filter by who submitted the feedback
  const displayFeedback = feedbackList.filter(
    (fb: Feedback) => (fb.submitted_by_role || "intern") === activeTab
  );

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Feedback <span className="text-indigo-600">Archive</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Review feedback submitted by interns and department managers.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit self-start md:self-center">
            <button
              onClick={() => setActiveTab("intern")}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black transition-all",
                activeTab === "intern" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Intern
            </button>
            <button
              onClick={() => setActiveTab("department")}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black transition-all",
                activeTab === "department" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Department
            </button>
          </div>
        </div>

        {/* Feedback count */}
        <p className="text-sm text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{displayFeedback.length}</span> feedback entries from{" "}
          <span className="text-indigo-600 font-bold">{activeTab === "intern" ? "Interns" : "Department Managers"}</span>
        </p>

        {/* Feedback grid */}
        {displayFeedback.length === 0 ? (
          <div className="text-center py-20 text-slate-400 italic">
            No feedback from {activeTab === "intern" ? "interns" : "department managers"} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFeedback.map((fb: Feedback) => (
              <div
                key={fb.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    {fb.intern.department?.name ?? "No Department"}
                  </span>
                </div>

                <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                  {fb.message}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm">
                      {fb.intern.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{fb.intern.user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {fb.submitted_by_role === "department" ? "Dept Evaluation" : "Intern"}
                      </p>
                    </div>
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


