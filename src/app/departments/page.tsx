"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  GET_DEPARTMENTS, 
  ADD_DEPARTMENT, 
  UPDATE_DEPARTMENT, 
  DELETE_DEPARTMENT,
  DepartmentsData,
  Department
} from "@/lib/graphql";
import { 
  Plus, 
  Edit, 
  Trash, 
  Search,
  Building2,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { data, loading, error, refetch } = useQuery<DepartmentsData>(GET_DEPARTMENTS);
  const [addDeptMutation] = useMutation(ADD_DEPARTMENT);
  const [updateDeptMutation] = useMutation(UPDATE_DEPARTMENT);
  const [deleteDeptMutation] = useMutation(DELETE_DEPARTMENT);

  const departments = data?.departments || [];

  const filteredDepts = useMemo(() => {
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDeptMutation({ variables: { name: formData.name } });
      setIsAddModalOpen(false);
      setFormData({ name: "" });
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error adding department");
    }
  };

  const handleEditClick = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({ name: dept.name });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await updateDeptMutation({ 
        variables: { id: selectedDept.id, name: formData.name } 
      });
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error updating department");
    }
  };

  const handleDeleteClick = (dept: Department) => {
    setSelectedDept(dept);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDept) return;
    try {
      await deleteDeptMutation({ variables: { id: selectedDept.id } });
      setIsDeleteModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Error deleting department. It may be linked to existing interns.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Departments <span className="text-indigo-600">Management</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Manage and organize academic departments.
            </p>
          </div>
          <button 
            onClick={() => { setFormData({ name: "" }); setIsAddModalOpen(true); }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Add Department
          </button>
        </div>

        <div className="bg-white rounded-2xl p-2 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by department name..."
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl text-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Intern Count</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold text-sm">Loading departments...</td></tr>
              ) : filteredDepts.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold text-sm italic">No departments found</td></tr>
              ) : filteredDepts.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                        <Building2 size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">
                      {dept.interns_aggregate?.aggregate?.count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                         onClick={() => handleEditClick(dept)}
                         className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                         onClick={() => handleDeleteClick(dept)}
                         className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {isAddModalOpen ? "New Department" : "Edit Department"}
              </h2>
              <button 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Department Name</label>
                <input 
                  required
                  type="text"
                  placeholder="Ex: Computer Science"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-300 font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  {isAddModalOpen ? "Create Now" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedDept && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-lg shadow-rose-100/50">
              <Trash size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 truncate px-2">
              {selectedDept.name}
            </h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              Delete this department? It may fail if interns are still assigned.
            </p>
            <div className="flex gap-3">
               <button 
                 onClick={() => setIsDeleteModalOpen(false)}
                 className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-all"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmDelete}
                 className="flex-1 py-3 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95"
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
