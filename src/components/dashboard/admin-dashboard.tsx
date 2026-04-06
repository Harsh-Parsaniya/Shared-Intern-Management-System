"use client";

import { useQuery } from "@apollo/client/react";
import { GET_DASHBOARD_STATS } from "@/lib/graphql";
import { 
  Users, 
  UserCheck, 
  ClipboardList, 
  TrendingUp,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminDashboardView() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, error } = useQuery<any>(GET_DASHBOARD_STATS);

  const chartData = useMemo(() => {
    const allInterns = data?.interns || [];
    
    // Aggregate by department
    const deptMap: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allInterns.forEach((intern: any) => {
      const dept = intern.department?.name || "Unassigned";
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const byDepartment = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Aggregate by college
    const collegeMap: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allInterns.forEach((intern: any) => {
      const college = intern.college_name || "Unknown";
      collegeMap[college] = (collegeMap[college] || 0) + 1;
    });
    const byCollege = Object.entries(collegeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { byDepartment, byCollege };
  }, [data]);

  if (loading) {
    return (
      <>
        <ChatBotWidget />
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <ChatBotWidget />
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


      {/* ChatBot */}

      <ChatBotWidget/>



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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 px-4 lg:px-0">
        {/* Pie Chart: Interns by Department */}
        <div className="bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base lg:text-lg font-bold text-slate-900 uppercase tracking-tight mb-6">Interns by Department</h3>
          {chartData.byDepartment.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.byDepartment}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {chartData.byDepartment.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: 600 }}
                />
                <Legend 
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm italic">No intern data available</div>
          )}
        </div>

        {/* Bar Chart: Interns by College */}
        <div className="bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base lg:text-lg font-bold text-slate-900 uppercase tracking-tight mb-6">Interns by College</h3>
          {chartData.byCollege.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.byCollege} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#94a3b8" }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#475569" }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm italic">No intern data available</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 lg:px-0">
        <div className="bg-white p-5 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
           <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">Program Activity</h3>
           <div className="space-y-6">
             {data?.recent_interns?.map((intern: { id: string; user: { name: string }; college_name: string }) => (
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
