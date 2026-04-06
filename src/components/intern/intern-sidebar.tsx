"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, User, MessageSquare, LogOut, Menu, X, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const NAV_LINKS = [
  { name: "My Dashboard", href: "/intern/dashboard", icon: Home },
  { name: "My Profile", href: "/intern/profile", icon: User },
  { name: "My Tasks", href: "/intern/tasks", icon: ClipboardList },
  { name: "Give Feedback", href: "/intern/feedback", icon: MessageSquare },
];

export function InternSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const internName = useSelector((state: RootState) => state.intern.name);

  function handleLogout() {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="intern-mobile-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`intern-sidebar ${menuOpen ? "intern-sidebar-open" : ""}`}>
        <div className="intern-sidebar-inner">

          {/* Logo */}
          <Link href="/intern/dashboard" className="intern-logo-link intern-logo-with-image">
            <img src="/next.svg" alt="IMS logo" className="h-10 w-10" />
            <h1 className="intern-logo-text">IMS Intern</h1>
          </Link>

          {/* Nav links */}
          <nav className="intern-nav">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`intern-nav-link ${isActive ? "intern-nav-link-active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={22} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user + logout */}
          <div className="intern-sidebar-footer">
            <div className="intern-user-info">
              <div className="intern-user-avatar">
                {internName ? internName.charAt(0).toUpperCase() : "I"}
              </div>
              <div>
                <p className="intern-user-name">{internName || "Intern"}</p>
                <p className="intern-user-session">Active Session</p>
              </div>
            </div>

            <button onClick={handleLogout} className="intern-logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>

        </div>
      </div>

      {/* Overlay for mobile */}
      {menuOpen && (
        <div
          className="intern-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
