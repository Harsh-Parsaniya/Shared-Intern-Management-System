"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_INTERNS,
  GET_DEPARTMENTS,
  ADD_INTERN,
  UPDATE_INTERN,
  DELETE_INTERN,
  InternsData,
  Intern,
  DepartmentsData,
  Department
} from "@/lib/graphql";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash,
  ChevronRight,
  Loader2,
  Download,
  FileText,
  Table as TableIcon,
  X,
  Calendar
} from "lucide-react";
import { useState, useMemo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InternsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // CRUD States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    college_name: "",
    department_id: "",
    start_date: "",
    end_date: ""
  });

  const { data, loading, error, refetch } = useQuery<InternsData>(GET_INTERNS);
  const { data: deptData } = useQuery<DepartmentsData>(GET_DEPARTMENTS);

  const [addInternMutation] = useMutation(ADD_INTERN);
  const [updateInternMutation] = useMutation(UPDATE_INTERN);
  const [deleteInternMutation] = useMutation(DELETE_INTERN);

  const interns = data?.interns || [];
  const departments = deptData?.departments || [];

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months += endDate.getMonth() - startDate.getMonth();

    if (months <= 0) return "1 month"; // Minimal display

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    let result = "";
    if (years > 0) result += `${years} yr${years > 1 ? 's' : ''} `;
    if (remainingMonths > 0) result += `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;

    return result.trim();
  };

  const filteredInterns = useMemo(() => {
    return interns.filter((intern: Intern) => {
      const matchesSearch =
        intern.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.college_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = !filterDept || intern.department?.name === filterDept;
      const matchesCollege = !filterCollege || intern.college_name.toLowerCase().includes(filterCollege.toLowerCase());

      const internStartDate = new Date(intern.start_date);
      const matchesStartDate = !filterStartDate || internStartDate >= new Date(filterStartDate);
      const matchesEndDate = !filterEndDate || internStartDate <= new Date(filterEndDate);

      return matchesSearch && matchesDept && matchesCollege && matchesStartDate && matchesEndDate;
    });
  }, [interns, searchTerm, filterDept, filterCollege, filterStartDate, filterEndDate]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Intern Directory", 14, 15);

    const tableData = filteredInterns.map(intern => [
      intern.user.name,
      intern.user.email,
      intern.college_name,
      intern.department?.name || "Unassigned",
      intern.start_date,
      intern.end_date
    ]);

    autoTable(doc, {
      head: [["Name", "Email", "College", "Department", "Start Date", "End Date"]],
      body: tableData,
      startY: 20,
    });

    doc.save("intern-directory.pdf");
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredInterns.map(intern => ({
      Name: intern.user.name,
      Email: intern.user.email,
      College: intern.college_name,
      Department: intern.department?.name || "Unassigned",
      StartDate: intern.start_date,
      EndDate: intern.end_date
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Interns");
    XLSX.writeFile(workbook, "intern-directory.xlsx");
    setIsExportOpen(false);
  };

  const clearFilters = () => {
    setFilterDept("");
    setFilterCollege("");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchTerm("");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addInternMutation({
        variables: {
          object: {
            college_name: formData.college_name,
            department_id: formData.department_id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            user: {
              data: {
                name: formData.name,
                email: formData.email,
                password: "password123",
                role: "intern",
                department_id: formData.department_id
              }
            }
          }
        }
      });
      setIsAddModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error adding intern.");
    }
  };

  const handleEditClick = (intern: Intern) => {
    setSelectedIntern(intern);
    setFormData({
      name: intern.user.name,
      email: intern.user.email,
      college_name: intern.college_name,
      department_id: intern.department_id || "",
      start_date: intern.start_date,
      end_date: intern.end_date
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;
    try {
      await updateInternMutation({
        variables: {
          userId: selectedIntern.user.id,
          userName: formData.name,
          userEmail: formData.email,
          internId: selectedIntern.id,
          collegeName: formData.college_name,
          deptId: formData.department_id,
          startDate: formData.start_date,
          endDate: formData.end_date
        }
      });
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error updating intern");
    }
  };

  const handleDeleteClick = (intern: Intern) => {
    setSelectedIntern(intern);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedIntern) return;
    try {
      await deleteInternMutation({
        variables: {
          userId: selectedIntern.user.id
        }
      });
      setIsDeleteModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error deleting intern");
    }
  };

  const handleAddNewClick = () => {
    setFormData({
      name: "",
      email: "",
      college_name: "",
      department_id: "",
      start_date: "",
      end_date: ""
    });
    setIsAddModalOpen(true);
  };

  if (loading) return (
    <MainLayout>
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Loading Directory...</p>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 lg:px-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Intern Directory
            </h1>
            <p className="text-slate-500 mt-1 lg:mt-2 font-medium text-sm lg:text-base">
              Manage and monitor all intern profiles in the system.
            </p>
          </div>
          <button
            onClick={handleAddNewClick}
            className="inline-flex items-center justify-center px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full sm:w-auto"
          >
            <Plus size={18} className="mr-2" />
            Add New Intern
          </button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 px-4 lg:px-0">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name, email or college..."
              className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "w-full sm:w-auto px-5 py-3 border rounded-2xl font-semibold text-sm flex items-center justify-center transition-all shadow-sm",
                  isFilterOpen || filterDept || filterCollege || filterStartDate || filterEndDate
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter size={18} className="mr-2" />
                Filters
                {(filterDept || filterCollege || filterStartDate || filterEndDate) && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 sm:w-80 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 p-5 lg:p-6 animate-in fade-in zoom-in duration-200 mx-4 sm:mx-0">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Advanced Search</h3>
                    <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                      <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      >
                        <option value="">All Departments</option>
                        {departments.map((dept: any) => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
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

            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-semibold text-sm flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download size={18} className="mr-2" />
                Export
              </button>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

        {/* Active Filters Bar */}
        {(filterDept || filterCollege || (filterStartDate && filterEndDate)) && (
          <div className="flex flex-wrap items-center gap-3 px-4 lg:px-0 animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest mr-1">Active Filters:</span>
            {filterDept && (
              <div className="inline-flex items-center px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] lg:text-xs font-bold text-indigo-700 shadow-sm">
                <span className="opacity-50 mr-2 uppercase font-black text-[9px]">Dept:</span> {filterDept}
                <button onClick={() => setFilterDept("")} className="ml-2 hover:bg-indigo-200 p-1 rounded-lg transition-colors"><X size={12} /></button>
              </div>
            )}
            {filterCollege && (
              <div className="inline-flex items-center px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] lg:text-xs font-bold text-emerald-700 shadow-sm">
                <span className="opacity-50 mr-2 uppercase font-black text-[9px]">College:</span> {filterCollege}
                <button onClick={() => setFilterCollege("")} className="ml-2 hover:bg-emerald-200 p-1 rounded-lg transition-colors"><X size={12} /></button>
              </div>
            )}
            {filterStartDate && filterEndDate && (
              <div className="inline-flex items-center px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-[10px] lg:text-xs font-bold text-amber-700 shadow-sm">
                <Calendar size={12} className="mr-2 opacity-50" />
                {filterStartDate} - {filterEndDate}
                <button onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }} className="ml-2 hover:bg-amber-200 p-1 rounded-lg transition-colors"><X size={12} /></button>
              </div>
            )}
            <button onClick={clearFilters} className="text-[10px] lg:text-xs font-black text-slate-400 hover:text-rose-500 transition-all ml-1 uppercase underline underline-offset-4 decoration-slate-200">Clear All</button>
          </div>
        )}

        {/* Interns Table */}
        <div className="bg-white rounded-[2rem] lg:rounded-3xl border border-slate-100 shadow-sm overflow-hidden mx-4 lg:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Intern Details</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">College</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Department</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Start Date</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">End Date</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Duration</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
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
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {intern.department?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{intern.start_date}</span>
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{intern.end_date}</span>
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold uppercase tracking-tight">
                        {calculateDuration(intern.start_date, intern.end_date)}
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
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(intern)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(intern)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"><Trash size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Showing <span className="text-slate-900 font-bold">{filteredInterns.length}</span> results</p>
            <div className="flex gap-2">
              <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-50"><ChevronRight className="rotate-180" size={16} /></button>
              <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-5 lg:px-6 py-4 lg:py-5 flex items-center justify-between border-b border-slate-50">
              <h2 className="text-sm lg:text-base font-bold text-slate-900 uppercase tracking-tight">
                {isAddModalOpen ? "New Intern" : "Edit Intern"}
              </h2>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="p-5 lg:p-8 space-y-5 lg:space-y-6">
              {/* Row 1: Full Name and Email Address */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: John Doe"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="Ex: john@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: College Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College Name</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Stanford University"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  value={formData.college_name}
                  onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                />
              </div>

              {/* Row 3: Department */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all capitalize font-bold"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Row 4: Start Date and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="flex-1 py-3 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95"
                >
                  {isAddModalOpen ? "Create Intern" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedIntern && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-lg shadow-rose-100/50">
              <Trash size={32} />
            </div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight mb-2">
              Delete Intern
            </h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Delete <span className="text-slate-900 font-bold">{selectedIntern.user.name}</span>'s record? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-rose-700 shadow-md shadow-rose-100 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
