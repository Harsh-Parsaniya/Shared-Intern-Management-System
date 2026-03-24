"use client";

import { useQuery } from "@apollo/client/react";
import { GET_DASHBOARD_STATS, DashboardStats } from "@/lib/graphql";
import { 
  Users, 
  UserCheck, 
  ClipboardList, 
  TrendingUp,
  BarChart3,
  MessageSquare,
  Loader2
} from "lucide-react";

export function AdminDashboardView() {
  const { data, loading, error } = useQuery<DashboardStats>(GET_DASHBOARD_STATS);

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
        <h2 className="text-lg font-bold">Error loading admin dashboard</h2>
        <p className="mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  const stats = [
    { label: "Total Interns", value: data?.interns_aggregate?.aggregate?.count || "0", icon: Users, color: "bg-indigo-500" },
    { label: "Active Now", value: data?.interns_aggregate?.aggregate?.count || "0", icon: UserCheck, color: "bg-emerald-500" },
    { label: "Pending Tasks", value: "0", icon: ClipboardList, color: "bg-amber-500" },
    { label: "Feedback Recd", value: data?.feedback_aggregate?.aggregate?.count || "0", icon: MessageSquare, color: "bg-violet-500" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-4 lg:px-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          Admin <span className="text-indigo-600">Dashboard</span>
        </h1>
        <p className="text-slate-500 mt-1 lg:mt-2 font-medium text-sm lg:text-base">
          Global overview of the internship program.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 px-4 lg:px-0">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/40 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 lg:p-3 rounded-2xl ${stat.color} text-white`}>
                  <Icon size={20} className="lg:w-6 lg:h-6" />
                </div>
                <span className="text-[10px] lg:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  +0%
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-slate-500 text-xs lg:text-sm font-medium">{stat.label}</h3>
                <p className="text-xl lg:text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 px-4 lg:px-0">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-base lg:text-lg font-bold text-slate-900 uppercase tracking-tight">Internship Trends</h3>
            <select className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="aspect-video lg:aspect-[16/9] w-full bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
             <div className="text-center px-4">
               <BarChart3 className="mx-auto text-slate-300 mb-2 lg:w-12 lg:h-12" size={40} />
               <p className="text-slate-400 text-xs lg:text-sm font-medium italic">Global metrics visualization</p>
             </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
           <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">Program Activity</h3>
           <div className="space-y-6">
             {data?.recent_interns?.map((intern) => (
               <div key={intern.id} className="flex gap-4">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                 <div>
                   <p className="text-sm font-semibold text-slate-800">New intern registered</p>
                   <p className="text-xs text-slate-500">{intern.user.name} ({intern.college_name})</p>
                   <p className="text-[10px] text-slate-400 mt-1">Recently</p>
                 </div>
               </div>
             )) || (
               <p className="text-sm text-slate-400 italic">No recent activity found.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
