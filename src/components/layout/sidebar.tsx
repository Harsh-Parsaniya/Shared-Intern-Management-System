"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  Building2
} from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["admin", "department", "intern"] },
  { name: "Departments", href: "/departments", icon: Building2, roles: ["admin", "department"] },
  { name: "Interns", href: "/interns", icon: Users, roles: ["admin", "department", "intern"] },
  { name: "Feedback", href: "/feedback", icon: MessageSquare, roles: ["admin", "department", "intern"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // Clear the auth-token cookie
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const filteredItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        className="lg:hidden fixed top-5 left-5 z-[60] p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <Link href="/dashboard" className="flex items-center justify-center h-20 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              IMS Admin
            </h1>
          </Link>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link 
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center p-3 mb-2 rounded-xl bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {role.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-slate-800 capitalize">{role}</p>
                <p className="text-xs text-slate-500">Active Session</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
