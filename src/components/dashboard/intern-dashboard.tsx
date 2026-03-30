"use client";

import { useQuery } from "@apollo/client/react";
import { GET_INTERN_DASHBOARD_DATA } from "@/lib/graphql";
import { 
  User, 
  Calendar, 
  Building2, 
  MessageSquare, 
  Star,
  Loader2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export function InternDashboardView({ userId }: { userId: string }) {
  const { data, loading, error } = useQuery<any>(GET_INTERN_DASHBOARD_DATA, {
    variables: { userId },
    skip: !userId
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600">
        <h2 className="text-lg font-bold">Error loading your dashboard</h2>
        <p className="mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  const intern = data?.interns?.[0];
  const recentFeedback = data?.feedback || [];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-4 lg:px-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight text-center lg:text-left">
          Welcome back, <span className="text-indigo-600">{intern?.user?.name || "Intern"}</span>!
        </h1>
        <p className="text-slate-500 mt-1 lg:mt-2 font-medium text-center lg:text-left text-sm lg:text-base">
          Track your progress and internship details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 px-4 lg:px-0">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            
            <div className="relative flex flex-col sm:flex-row gap-6 lg:gap-8 items-center sm:items-start text-center sm:text-left">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl lg:text-3xl font-black shadow-xl shadow-indigo-200 shrink-0">
                {intern?.user?.name?.[0] || 'I'}
              </div>
              <div className="flex-1 space-y-4 w-full">
                 <div>
                   <h2 className="text-xl lg:text-2xl font-bold text-slate-900">{intern?.user?.name}</h2>
                   <p className="text-slate-500 font-medium text-sm lg:text-base">{intern?.user?.email}</p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                   <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-600">
                     <Building2 size={16} className="text-indigo-500 lg:w-[18px] lg:h-[18px]" />
                     <span className="text-xs lg:text-sm font-bold">{intern?.department?.name || 'Assigned Department'}</span>
                   </div>
                   <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-600">
                     <User size={16} className="text-indigo-500 lg:w-[18px] lg:h-[18px]" />
                     <span className="text-xs lg:text-sm font-bold">{intern?.college_name}</span>
                   </div>
                   <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-600 sm:col-span-2">
                     <Calendar size={16} className="text-indigo-500 lg:w-[18px] lg:h-[18px]" />
                     <span className="text-xs lg:text-sm font-bold">{intern?.start_date} to {intern?.end_date}</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 lg:p-8 rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-between group">
            <div className="text-white">
              <h3 className="text-lg lg:text-xl font-bold mb-1">Weekly Feedback</h3>
              <p className="text-indigo-100 text-xs lg:text-sm font-medium">Keep sharing your experience to help us improve.</p>
            </div>
            <Link href="/feedback" className="p-3 lg:p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all group-hover:translate-x-1">
              <ChevronRight size={20} className="lg:w-6 lg:h-6" />
            </Link>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-base lg:text-lg font-bold text-slate-900 uppercase tracking-tight">Your Feedback</h3>
             <MessageSquare size={18} className="text-slate-400 lg:w-5 lg:h-5" />
           </div>
           
           <div className="space-y-4">
             {recentFeedback.length > 0 ? recentFeedback.map((fb: any) => (
                <div key={fb.id} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="flex text-amber-500">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} size={10} fill={i < fb.rating ? "currentColor" : "none"} className={i < fb.rating ? "" : "text-slate-200"} />
                       ))}
                     </div>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       {new Date(fb.created_at).toLocaleDateString()}
                     </span>
                   </div>
                   <p className="text-xs lg:text-sm text-slate-600 line-clamp-2 italic font-medium">{fb.message}</p>
                </div>
             )) : (
               <div className="text-center py-10 text-slate-400">
                 <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <MessageSquare size={18} className="lg:w-5 lg:h-5" />
                 </div>
                 <p className="text-xs lg:text-sm italic">No feedback submitted yet.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
