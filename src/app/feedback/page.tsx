"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery } from "@apollo/client/react";
import { GET_FEEDBACK, GET_DEPARTMENTS, FeedbackData, Feedback, DepartmentsData } from "@/lib/graphql";
import { Star, Calendar, Loader2, Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FeedbackPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [feedbackType, setFeedbackType] = useState<"all" | "intern" | "department">("all");
  const filterRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useQuery<FeedbackData>(GET_FEEDBACK);
  const { data: deptData } = useQuery<DepartmentsData>(GET_DEPARTMENTS);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const departments = deptData?.departments || [];

  // Apply filters
  const displayFeedback = feedbackList.filter((fb: Feedback) => {
    const matchesDept =
      selectedDepartment === "all" || fb.intern.department?.id === selectedDepartment;
    const matchesType =
      feedbackType === "all" || (fb.submitted_by_role || "intern") === feedbackType;
    const matchesSearch =
      !searchQuery ||
      fb.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.intern.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fb.intern.department?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesType && matchesSearch;
  });

  const activeFilterCount =
    (selectedDepartment !== "all" ? 1 : 0) + (feedbackType !== "all" ? 1 : 0);

  function clearFilters() {
    setSelectedDepartment("all");
    setFeedbackType("all");
  }

  const selectedDeptName =
    departments.find((d) => d.id === selectedDepartment)?.name ?? "All Departments";

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Feedback <span className="text-indigo-600">Archive</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Comprehensive review of program and department feedback.
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search feedback archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            />
          </div>

          {/* Filters button + dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold transition-all",
                filterOpen || activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
              )}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-indigo-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={cn("transition-transform", filterOpen && "rotate-180")}
              />
            </button>

            {/* Dropdown panel */}
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl border border-slate-100 shadow-xl z-50 p-5 space-y-5">

                {/* Department filter */}
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Department
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    <button
                      onClick={() => setSelectedDepartment("all")}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                        selectedDepartment === "all"
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      All Departments
                    </button>
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => setSelectedDepartment(dept.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                          selectedDepartment === dept.id
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback type filter — only visible when a dept is selected */}
                {selectedDepartment !== "all" && (
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Feedback Type
                    </p>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {(["all", "intern", "department"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFeedbackType(type)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-black capitalize transition-all",
                            feedbackType === type
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          {type === "all" ? "All" : type === "intern" ? "Intern" : "Dept"}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                      {feedbackType === "intern"
                        ? "Showing feedback submitted by interns"
                        : feedbackType === "department"
                        ? "Showing feedback submitted by dept managers"
                        : "Showing all feedback types"}
                    </p>
                  </div>
                )}

                {/* Clear filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-all border border-red-100"
                  >
                    <X size={12} />
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {(selectedDepartment !== "all" || feedbackType !== "all") && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedDepartment !== "all" && (
              <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full">
                {selectedDeptName}
                <button onClick={() => setSelectedDepartment("all")}>
                  <X size={11} />
                </button>
              </span>
            )}
            {feedbackType !== "all" && (
              <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full capitalize">
                {feedbackType === "intern" ? "Intern Feedback" : "Dept Feedback"}
                <button onClick={() => setFeedbackType("all")}>
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{displayFeedback.length}</span> feedback{" "}
          {selectedDepartment !== "all" && (
            <>in <span className="text-indigo-600 font-bold">{selectedDeptName}</span></>
          )}
        </p>

        {/* Feedback grid */}
        {displayFeedback.length === 0 ? (
          <div className="text-center py-20 text-slate-400 italic">
            No feedback found for the selected filters.
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


