"use client";

import { useQuery } from "@apollo/client/react";
import { GET_DEPT_DASHBOARD_STATS, DashboardStats } from "@/lib/graphql";
import { 
  Users, 
  MessageSquare,
  Building2,
  TrendingUp,
  Loader2,
  BarChart3
} from "lucide-react";

export function DeptDashboardView({ departmentId }: { departmentId: string }) {
  const { data, loading, error } = useQuery<DashboardStats>(GET_DEPT_DASHBOARD_STATS, {
    variables: { departmentId },
    skip: !departmentId
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
        <h2 className="text-lg font-bold">Error loading department dashboard</h2>
        <p className="mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  const stats = [
    { label: "My Interns", value: data?.interns_aggregate?.aggregate?.count || "0", icon: Users, color: "bg-indigo-500" },
    { label: "Dept Feedback", value: data?.feedback_aggregate?.aggregate?.count || "0", icon: MessageSquare, color: "bg-violet-500" },
    { label: "Department", value: "Active", icon: Building2, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-4 lg:px-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          Department <span className="text-indigo-600">Dashboard</span>
        </h1>
        <p className="text-slate-500 mt-1 lg:mt-2 font-medium text-sm lg:text-base">
          Management overview for your department's interns.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 px-4 lg:px-0">
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
                  Live
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 px-4 lg:px-0">
        <div className="lg:col-span-2 bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
           <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">Department Interns</h3>
           <div className="overflow-x-auto rounded-2xl border border-slate-100 scrollbar-hide">
             <table className="w-full text-left border-collapse min-w-[500px]">
               <thead>
                 <tr className="bg-slate-50/50">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">College</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {data?.recent_interns?.length ? data.recent_interns.map(intern => (
                   <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 text-sm font-bold text-slate-700">{intern.user.name}</td>
                     <td className="px-6 py-4 text-sm text-slate-500">{intern.college_name}</td>
                   </tr>
                 )) : (
                   <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">No interns in this department yet</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        <div className="bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
           <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">Recent Reports</h3>
           <div className="aspect-video lg:aspect-square w-full bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
              <div className="text-center px-4">
                <BarChart3 className="mx-auto text-slate-300 mb-2 lg:w-12 lg:h-12" size={40} />
                <p className="text-slate-400 text-xs lg:text-sm font-medium italic">Metrics visualization</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
