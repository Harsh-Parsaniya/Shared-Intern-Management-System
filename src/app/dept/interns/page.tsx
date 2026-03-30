"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery } from "@apollo/client/react";
import { GET_INTERNS } from "@/lib/graphql";
import {
  Search, Filter, Download, FileText, Table as TableIcon, X, Calendar
} from "lucide-react";
import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function getDuration(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return months <= 1 ? "1 MONTH" : `${months} MONTHS`;
}

function getStatus(start: string, end: string) {
  const today = new Date();
  const s = new Date(start);
  const e = new Date(end);
  return today >= s && today <= e ? "Active" : "Inactive";
}

export default function DeptInternsPage() {
  const { deptId } = useSelector((state: RootState) => state.dept);
  const [search, setSearch] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { data } = useQuery<any>(GET_INTERNS);

  const allInterns = data?.interns || [];

  // Filter to this department only
  const deptInterns = allInterns.filter((i: any) => i.department_id === deptId);

  // Apply all filters
  const filtered = useMemo(() => {
    return deptInterns.filter((i: any) => {
      const q = search.toLowerCase();
      const matchSearch =
        i.user.name.toLowerCase().includes(q) ||
        i.user.email.toLowerCase().includes(q) ||
        i.college_name.toLowerCase().includes(q);
      const matchCollege = !filterCollege || i.college_name.toLowerCase().includes(filterCollege.toLowerCase());
      const internStart = new Date(i.start_date);
      const matchStart = !filterStartDate || internStart >= new Date(filterStartDate);
      const matchEnd = !filterEndDate || internStart <= new Date(filterEndDate);
      return matchSearch && matchCollege && matchStart && matchEnd;
    });
  }, [deptInterns, search, filterCollege, filterStartDate, filterEndDate]);

  const clearFilters = () => {
    setFilterCollege("");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearch("");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Intern Directory", 14, 15);
    autoTable(doc, {
      head: [["Name", "Email", "College", "Start Date", "End Date"]],
      body: filtered.map((i: any) => [
        i.user.name, i.user.email, i.college_name, i.start_date, i.end_date
      ]),
      startY: 20,
    });
    doc.save("intern-directory.pdf");
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered.map((i: any) => ({
      Name: i.user.name,
      Email: i.user.email,
      College: i.college_name,
      StartDate: i.start_date,
      EndDate: i.end_date,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Interns");
    XLSX.writeFile(workbook, "intern-directory.xlsx");
    setIsExportOpen(false);
  };

  return (
    <div className="dept-page">

      <div>
        <h1 className="dept-page-title">Intern Directory</h1>
        <p className="dept-page-subtitle">Monitor intern profiles in your department.</p>
      </div>

      {/* Search + Filter + Export bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by name, email or college..."
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Filters */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-5 py-3 border rounded-2xl font-semibold text-sm flex items-center transition-all shadow-sm ${
                isFilterOpen || filterCollege || filterStartDate || filterEndDate
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter size={18} className="mr-2" />
              Filters
              {(filterCollege || filterStartDate || filterEndDate) && (
                <span className="ml-2 w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Advanced Search</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College</label>
                    <input
                      type="text"
                      placeholder="Search college..."
                      value={filterCollege}
                      onChange={(e) => setFilterCollege(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start From</label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ends By</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div className="pt-3 flex gap-3">
                    <button onClick={clearFilters} className="flex-1 py-3 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 rounded-2xl transition-all">Clear</button>
                    <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-semibold text-sm flex items-center hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download size={18} className="mr-2" />
              Export
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 py-2 overflow-hidden">
                <button onClick={handleExportPDF} className="w-full px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 flex items-center group">
                  <FileText size={16} className="mr-2 text-rose-400 group-hover:text-rose-500" />
                  PDF Document
                </button>
                <button onClick={handleExportExcel} className="w-full px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 flex items-center group">
                  <TableIcon size={16} className="mr-2 text-emerald-400 group-hover:text-emerald-500" />
                  Excel Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filter pills */}
      {(filterCollege || (filterStartDate && filterEndDate)) && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">Active Filters:</span>
          {filterCollege && (
            <div className="inline-flex items-center px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-700 shadow-sm">
              <span className="opacity-50 mr-2 uppercase font-black text-[9px]">College:</span> {filterCollege}
              <button onClick={() => setFilterCollege("")} className="ml-2 hover:bg-emerald-200 p-1 rounded-lg transition-colors"><X size={12} /></button>
            </div>
          )}
          {filterStartDate && filterEndDate && (
            <div className="inline-flex items-center px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-xs font-bold text-amber-700 shadow-sm">
              <Calendar size={12} className="mr-2 opacity-50" />
              {filterStartDate} — {filterEndDate}
              <button onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }} className="ml-2 hover:bg-amber-200 p-1 rounded-lg transition-colors"><X size={12} /></button>
            </div>
          )}
          <button onClick={clearFilters} className="text-xs font-black text-slate-400 hover:text-rose-500 transition-all ml-1 uppercase underline underline-offset-4 decoration-slate-200">Clear All</button>
        </div>
      )}

      {/* Interns table */}
      <div className="dept-card dept-table-card">
        <table className="dept-dir-table">
          <thead>
            <tr>
              <th>Intern Details</th>
              <th>College</th>
              <th>Department</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((intern: any) => {
              const status = getStatus(intern.start_date, intern.end_date);
              return (
                <tr key={intern.id}>
                  <td>
                    <div className="dept-intern-details">
                      <div className="dept-intern-avatar">
                        {intern.user.name.charAt(0).toLowerCase()}
                      </div>
                      <div>
                        <p className="dept-intern-name">{intern.user.name}</p>
                        <p className="dept-intern-email">{intern.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{intern.college_name}</td>
                  <td>
                    <span className="dept-dept-tag">{intern.department?.name}</span>
                  </td>
                  <td className="dept-date-cell">{intern.start_date}</td>
                  <td className="dept-date-cell">{intern.end_date}</td>
                  <td>
                    <span className="dept-duration-tag">
                      {getDuration(intern.start_date, intern.end_date)}
                    </span>
                  </td>
                  <td>
                    <span className={`dept-status-tag ${status === "Active" ? "dept-status-active" : "dept-status-inactive"}`}>
                      <span className="dept-status-dot" /> {status}
                    </span>
                  </td>
                  <td>
                    <span className="dept-view-only">View Only</span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="dept-table-empty">No interns found</td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="dept-showing-count">Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
      </div>

    </div>
  );
}
