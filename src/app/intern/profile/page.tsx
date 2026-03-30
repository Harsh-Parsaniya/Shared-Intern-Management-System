"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import { Building2, User, Calendar, Mail } from "lucide-react";

export default function InternProfilePage() {
  const intern = useSelector((state: RootState) => state.intern);
  const router = useRouter();

  function handleLogout() {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  }

  return (
    <div className="intern-page">
      <h1 className="intern-page-title">My Account</h1>

      {/* Top profile card */}
      <div className="intern-card intern-account-card">
        <div className="intern-account-avatar">
          {intern.name ? intern.name.charAt(0).toUpperCase() : "I"}
        </div>
        <div className="intern-account-info">
          <h2 className="intern-account-name">{intern.name}</h2>
          <div className="intern-account-email-row">
            <Mail size={14} />
            <span>{intern.email}</span>
          </div>
          <div className="intern-account-status">
            <span className="intern-status-dot" />
            Active
          </div>
        </div>
        <button onClick={handleLogout} className="intern-account-logout">
          Logout
        </button>
      </div>

      {/* Personal details card */}
      <div className="intern-card">
        <h3 className="intern-section-title">Personal Details</h3>
        <div className="intern-details-grid">
          <div className="intern-detail-item">
            <div className="intern-detail-icon">
              <Building2 size={16} />
            </div>
            <div>
              <p className="intern-detail-label">Department</p>
              <p className="intern-detail-value">{intern.department || "—"}</p>
            </div>
          </div>

          <div className="intern-detail-item">
            <div className="intern-detail-icon">
              <User size={16} />
            </div>
            <div>
              <p className="intern-detail-label">College Name</p>
              <p className="intern-detail-value">{intern.collegeName || "—"}</p>
            </div>
          </div>

          <div className="intern-detail-item">
            <div className="intern-detail-icon">
              <Calendar size={16} />
            </div>
            <div>
              <p className="intern-detail-label">Internship Period</p>
              <p className="intern-detail-value">
                {intern.startDate && intern.endDate
                  ? `${intern.startDate} to ${intern.endDate}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
