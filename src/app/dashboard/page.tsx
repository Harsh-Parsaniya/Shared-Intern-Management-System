"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useEffect, useState } from "react";
import { AdminDashboardView } from "@/components/dashboard/admin-dashboard";
import { DeptDashboardView } from "@/components/dashboard/dept-dashboard";
import { InternDashboardView } from "@/components/dashboard/intern-dashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [authData, setAuthData] = useState<{
    role: string;
    userId: string;
    departmentId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return "";
    };

    const token = getCookie("auth-token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAuthData({
          role: payload.role || "intern",
          userId: payload.userId || "",
          departmentId: payload.departmentId || null,
        });
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      </MainLayout>
    );
  }

  const renderDashboard = () => {
    if (!authData) return <div className="p-8 text-center text-slate-500 italic">No session found. Please log in.</div>;

    switch (authData.role) {
      case "admin":
        return <AdminDashboardView />;
      case "department":
        return <DeptDashboardView departmentId={authData.departmentId || ""} />;
      case "intern":
        return <InternDashboardView userId={authData.userId} />;
      default:
        return <InternDashboardView userId={authData.userId} />;
    }
  };

  return (
    <MainLayout>
      {renderDashboard()}
    </MainLayout>
  );
}

