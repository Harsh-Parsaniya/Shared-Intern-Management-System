"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery } from "@apollo/client/react";
import { GET_INTERNS, InternsData, Intern } from "@/lib/graphql";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InternsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, loading, error } = useQuery<InternsData>(GET_INTERNS);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      </MainLayout>
    );
  }

  const interns = data?.interns || [];
  const filteredInterns = interns.filter((intern: any) => 
    intern.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.college_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Intern Directory
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Manage and monitor all intern profiles in the system.
            </p>
          </div>
          <button className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 self-start sm:self-center">
            <Plus size={18} className="mr-2" />
            Add New Intern
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
               <Search size={18} />
             </div>
             <input
               type="text"
               placeholder="Search by name, email or college..."
               className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex gap-4">
              <button className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-semibold text-sm flex items-center hover:bg-slate-50 transition-colors shadow-sm">
                <Filter size={18} className="mr-2" />
                Filters
              </button>
              <button className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-semibold text-sm flex items-center hover:bg-slate-50 transition-colors shadow-sm">
                Export
              </button>
           </div>
        </div>

        {/* Interns Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Intern Details</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">College</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInterns.map((intern: Intern) => (
                  <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold border border-indigo-100 mr-3">
                          {intern.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{intern.user.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{intern.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">{intern.college_name}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {intern.department?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold leading-none ring-1 ring-inset",
                        "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      )}>
                         <span className={cn(
                           "w-1.5 h-1.5 rounded-full mr-2",
                           "bg-emerald-500"
                         )} />
                         {"Active"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2 px-2">
                         <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <Edit size={18} />
                         </button>
                         <button className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <Trash size={18} />
                         </button>
                         <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg">
                           <MoreVertical size={18} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
             <p className="text-xs text-slate-500 font-medium">Showing <span className="text-slate-900 font-bold">4</span> interns</p>
             <div className="flex gap-2">
               <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-50">
                 <ChevronRight className="rotate-180" size={16} />
               </button>
               <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600">
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
