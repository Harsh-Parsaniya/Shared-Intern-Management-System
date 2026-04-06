"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, MessageSquare, LogOut, Menu, X, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const NAV_LINKS = [
  { name: "Dashboard", href: "/dept/dashboard", icon: Home },
  { name: "Interns", href: "/dept/interns", icon: Users },
  { name: "Tasks", href: "/dept/tasks", icon: ClipboardList },
  { name: "Feedback", href: "/dept/feedback", icon: MessageSquare },
];

export function DeptSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const deptName = useSelector((state: RootState) => state.dept.deptName);

  function handleLogout() {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="dept-mobile-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`dept-sidebar ${menuOpen ? "dept-sidebar-open" : ""}`}>
        <div className="dept-sidebar-inner">

          {/* Logo — shows "IMS Department-Name" */}
          <Link href="/dept/dashboard" className="dept-logo-link dept-logo-with-image">
            <img src="/next.svg" alt="IMS logo" className="h-10 w-10" />
            <h1 className="dept-logo-text">
              IMS {deptName || "Department"}
            </h1>
          </Link>

          {/* Nav links */}
          <nav className="dept-nav">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`dept-nav-link ${isActive ? "dept-nav-link-active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={22} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer — dept name + active session + logout */}
          <div className="dept-sidebar-footer">
            <div className="dept-user-info">
              <div className="dept-user-avatar">
                {deptName ? deptName.charAt(0).toUpperCase() : "D"}
              </div>
              <div>
                <p className="dept-user-name">{deptName || "Department"}</p>
                <p className="dept-user-session">Active Session</p>
              </div>
            </div>

            <button onClick={handleLogout} className="dept-logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>

        </div>
      </div>

      {/* Overlay for mobile */}
      {menuOpen && (
        <div
          className="dept-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
