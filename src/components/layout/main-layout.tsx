"use client";

import { Sidebar } from "./sidebar";
import { ReactNode, useEffect, useState } from "react";

export function MainLayout({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string>("intern");

  useEffect(() => {
    // Get role from cookie (client-side)
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
        const userRole = payload.role || "intern";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRole(userRole);
      } catch {
        setRole("intern");
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
