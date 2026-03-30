"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_MANAGERS,
  GET_DEPARTMENTS,
  ADD_MANAGER,
  UPDATE_MANAGER,
  DELETE_MANAGER,
  SYNC_USER_DEPARTMENT,
  CLEAR_DEPT_MANAGER,
  CLEAR_USER_DEPT,
  DepartmentsData,
  Department
} from "@/lib/graphql";
import {
  Search,
  Plus,
  Edit,
  Trash,
  ChevronRight,
  Loader2,
  Download,
  FileText,
  Table as TableIcon,
  X,
  Lock
} from "lucide-react";
import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Manager {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
}

export default function ManagersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);

  // CRUD States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department_id: "",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, refetch } = useQuery<any>(GET_MANAGERS);
  const { data: deptData } = useQuery<DepartmentsData>(GET_DEPARTMENTS);

  const [addManagerMutation] = useMutation(ADD_MANAGER);
  const [updateManagerMutation] = useMutation(UPDATE_MANAGER);
  const [deleteManagerMutation] = useMutation(DELETE_MANAGER);
  const [syncUserDeptMutation] = useMutation(SYNC_USER_DEPARTMENT);
  const [clearDeptManagerMutation] = useMutation(CLEAR_DEPT_MANAGER);

  const managers: Manager[] = data?.users || [];
  const departments = deptData?.departments || [];

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return "Unassigned";
    const dept = departments.find((d: Department) => d.id === deptId);
    return dept?.name || "Unknown";
  };

  const filteredManagers = useMemo(() => {
    return managers.filter((mgr: Manager) => {
      const matchesSearch =
        mgr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mgr.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDeptName(mgr.department_id).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managers, searchTerm, departments]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Manager Directory", 14, 15);
    const tableData = filteredManagers.map(mgr => [
      mgr.name,
      mgr.email,
      getDeptName(mgr.department_id)
    ]);
    autoTable(doc, {
      head: [["Name", "Email", "Department"]],
      body: tableData,
      startY: 20,
    });
    doc.save("manager-directory.pdf");
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredManagers.map(mgr => ({
      Name: mgr.name,
      Email: mgr.email,
      Department: getDeptName(mgr.department_id),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Managers");
    XLSX.writeFile(workbook, "manager-directory.xlsx");
    setIsExportOpen(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id) {
      alert("Please select a department for the manager.");
      return;
    }
    try {
      const { hash } = await import("bcryptjs");
      const hashedPassword = await hash(formData.password, 10);
      const { data: addData } = await addManagerMutation({
        variables: {
          name: formData.name,
          email: formData.email,
          password: hashedPassword,
          department_id: formData.department_id,
        }
      }) as { data: { insert_users_one: { id: string } } };

      const newUserId = addData.insert_users_one.id;
      // Sync department side
      await syncUserDeptMutation({
        variables: {
          userId: newUserId,
          deptId: formData.department_id
        }
      });

      setIsAddModalOpen(false);
      setFormData({ name: "", email: "", password: "", department_id: "" });
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error adding manager. Email may already exist.");
    }
  };

  const handleEditClick = (mgr: Manager) => {
    setSelectedManager(mgr);
    setFormData({
      name: mgr.name,
      email: mgr.email,
      password: "",
      department_id: mgr.department_id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;
    if (!formData.department_id) {
      alert("Please select a department for the manager.");
      return;
    }
    try {
      // 1. If department changed, clear old department's manager
      if (selectedManager.department_id && selectedManager.department_id !== formData.department_id) {
        await clearDeptManagerMutation({
          variables: { deptId: selectedManager.department_id }
        });
      }

      // 2. Update manager and sync new department
      await updateManagerMutation({
        variables: {
          id: selectedManager.id,
          name: formData.name,
          email: formData.email,
          department_id: formData.department_id,
        }
      });

      await syncUserDeptMutation({
        variables: {
          userId: selectedManager.id,
          deptId: formData.department_id
        }
      });

      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error updating manager");
    }
  };

  const handleDeleteClick = (mgr: Manager) => {
    setSelectedManager(mgr);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedManager) return;
    try {
      // 1. Clear department association first to avoid FK constraints or dangling refs
      if (selectedManager.department_id) {
        await clearDeptManagerMutation({
          variables: { deptId: selectedManager.department_id }
        });
      }
      
      await deleteManagerMutation({ variables: { id: selectedManager.id } });
      setIsDeleteModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error deleting manager. Ensure they are not linked to critical records.");
    }
  };

  const handleAddNewClick = () => {
    setFormData({ name: "", email: "", password: "", department_id: "" });
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
              Manager Directory
            </h1>
            <p className="text-slate-500 mt-1 lg:mt-2 font-medium text-sm lg:text-base">
              Manage department heads and managers.
            </p>
          </div>
          <button
            onClick={handleAddNewClick}
            className="inline-flex items-center justify-center px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full sm:w-auto"
          >
            <Plus size={18} className="mr-2" />
            Add New Manager
          </button>
        </div>

        {/* Search & Export Bar */}
        <div className="flex flex-col md:flex-row gap-4 px-4 lg:px-0">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name, email or department..."
              className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
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

        {/* Managers Table */}
        <div className="bg-white rounded-[2rem] lg:rounded-3xl border border-slate-100 shadow-sm overflow-hidden mx-4 lg:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Manager Details</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Department</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredManagers.map((mgr: Manager) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-700 font-bold border border-violet-100 mr-3">
                          {mgr.name.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{mgr.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">{mgr.email}</td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {getDeptName(mgr.department_id)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(mgr)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(mgr)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"><Trash size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Showing <span className="text-slate-900 font-bold">{filteredManagers.length}</span> results</p>
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
                {isAddModalOpen ? "New Manager" : "Edit Manager"}
              </h2>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="p-5 lg:p-8 space-y-5 lg:space-y-6">
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Jane Smith"
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
                    placeholder="Ex: jane@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Password (Add only) */}
              {isAddModalOpen && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-300" size={16} />
                    <input
                      required
                      type="password"
                      placeholder="Set a password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Row 3: Department */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all capitalize font-bold"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments
                    .filter((dept: Department) => {
                      // Hide departments that already have a manager, except the current manager's dept
                      if (!dept.manager_id) return true;
                      if (isEditModalOpen && selectedManager && dept.manager_id === selectedManager.id) return true;
                      return false;
                    })
                    .map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
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
                  {isAddModalOpen ? "Create Manager" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedManager && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-lg shadow-rose-100/50">
              <Trash size={32} />
            </div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight mb-2">
              Delete Manager
            </h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Delete <span className="text-slate-900 font-bold">{selectedManager.name}</span>&apos;s record? This cannot be undone.
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
