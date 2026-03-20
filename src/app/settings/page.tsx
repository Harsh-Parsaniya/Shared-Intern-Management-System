"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Save,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [role, setRole] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return '';
      };
  
      const token = getCookie('auth-token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRole(payload.role || "intern");
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setEmail(payload.email || "user@example.com");
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setName(payload.name || "User");
        } catch {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRole("intern");
        }
      }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert("Profile updated successfully!");
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Account Settings
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Manage your profile information and account security.
          </p>
        </div>

        <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-lg mx-auto flex items-center justify-center text-3xl font-bold text-indigo-600 mb-4">
                {name.charAt(0)}
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
              <p className="text-sm text-slate-500 capitalize mb-6">{role}</p>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                Change Profile Photo
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm mb-4">Security Status</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Two-Factor Auth</span>
                        <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-md font-bold">Disabled</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Last Login</span>
                        <span className="text-slate-900 font-bold">2 hours ago</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 mb-8 border-b border-slate-50 pb-4 flex items-center">
                 <User className="mr-3 text-indigo-500" size={20} />
                 Personal Information
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700">Display Name</label>
                   <div className="relative">
                     <User className="absolute left-3 top-3 text-slate-300" size={18} />
                     <input 
                       type="text"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium text-slate-900" 
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700">Email Address</label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-3 text-slate-300" size={18} />
                     <input 
                       type="email"
                       value={email}
                       readOnly
                       className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl cursor-not-allowed opacity-60 text-sm font-medium text-slate-500" 
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700">Current Role</label>
                   <div className="relative">
                     <Shield className="absolute left-3 top-3 text-slate-300" size={18} />
                     <input 
                       type="text"
                       value={role}
                       readOnly
                       className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl cursor-not-allowed opacity-60 text-sm font-medium text-slate-500 capitalize" 
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700">Notifications</label>
                   <div className="relative">
                     <Bell className="absolute left-3 top-3 text-slate-300" size={18} />
                     <select className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium text-slate-900 appearance-none">
                       <option>All Notifications</option>
                       <option>Important Only</option>
                       <option>Muted</option>
                     </select>
                   </div>
                 </div>
               </div>

               <div className="mt-10 flex justify-end">
                 <button 
                   onClick={handleSave}
                   disabled={saving}
                   className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center disabled:opacity-50"
                 >
                   {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                   {saving ? "Saving..." : "Save Changes"}
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
