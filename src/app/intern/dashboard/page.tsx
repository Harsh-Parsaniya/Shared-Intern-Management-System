"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery } from "@apollo/client/react";
import { GET_INTERN_DASHBOARD_DATA, GET_INTERNS } from "@/lib/graphql";
import { Star, MessageSquare, Building2, User, Calendar } from "lucide-react";
import Link from "next/link";

export default function InternDashboardPage() {
  const intern = useSelector((state: RootState) => state.intern);

  const { data: internData } = useQuery<any>(GET_INTERN_DASHBOARD_DATA, {
    variables: { userId: intern.userId },
    skip: !intern.userId,
  });

  const { data: internsListData } = useQuery<any>(GET_INTERNS);

  const feedback = internData?.feedback || [];

  // Filter interns from the same department
  const allInterns = internsListData?.interns || [];
  const deptInterns = intern.department
    ? allInterns.filter((i: any) => i.department?.name === intern.department)
    : allInterns.slice(0, 5);

  const activeCount = deptInterns.length;

  return (
    <div className="intern-page">

      {/* Welcome header */}
      <div className="intern-welcome">
        <h1 className="intern-welcome-title">
          Welcome back, <span className="intern-welcome-name">{intern.name}</span>!
        </h1>
        <p className="intern-welcome-sub">Track your progress and internship details.</p>
      </div>

      <div className="intern-dashboard-grid">

        {/* Left column */}
        <div className="intern-dashboard-left">

          {/* Profile card */}
          <div className="intern-card intern-profile-card">
            <div className="intern-profile-card-bg" />
            <div className="intern-profile-top">
              <div className="intern-avatar-big">
                {intern.name ? intern.name.charAt(0).toUpperCase() : "I"}
              </div>
              <div className="intern-profile-details">
                <h2 className="intern-profile-name">{intern.name}</h2>
                <p className="intern-profile-email">{intern.email}</p>
                <div className="intern-profile-meta">
                  <div className="intern-meta-row">
                    <Building2 size={15} className="intern-meta-icon" />
                    <span>{intern.department || "Department"}</span>
                  </div>
                  <div className="intern-meta-row">
                    <User size={15} className="intern-meta-icon" />
                    <span>{intern.collegeName || "College"}</span>
                  </div>
                  <div className="intern-meta-row intern-meta-full">
                    <Calendar size={15} className="intern-meta-icon" />
                    <span>{intern.startDate} to {intern.endDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interns list table */}
          <div className="intern-card">
            <div className="intern-table-header">
              <h3 className="intern-table-title">Interns List</h3>
              <span className="intern-badge">{activeCount} Active</span>
            </div>
            <table className="intern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>College</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {deptInterns.map((i: any) => (
                  <tr key={i.id}>
                    <td className="intern-table-name">{i.user?.name}</td>
                    <td>
                      <span className="intern-dept-tag">{i.department?.name}</span>
                    </td>
                    <td>{i.college_name}</td>
                    <td className="intern-table-email">{i.user?.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column - Feedback panel */}
        <div className="intern-card intern-feedback-panel">
          <div className="intern-feedback-header">
            <h3 className="intern-feedback-title">YOUR FEEDBACK</h3>
            <MessageSquare size={16} className="intern-feedback-icon" />
          </div>

          {feedback.length === 0 ? (
            <div className="intern-no-feedback">
              <p>No feedback yet.</p>
              <Link href="/intern/feedback" className="intern-feedback-link">
                Give your first feedback
              </Link>
            </div>
          ) : (
            <div className="intern-feedback-list">
              {feedback.map((fb: any) => (
                <div key={fb.id} className="intern-feedback-item">
                  <div className="intern-feedback-top">
                    <div className="intern-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={11}
                          fill={star <= fb.rating ? "#f59e0b" : "none"}
                          color={star <= fb.rating ? "#f59e0b" : "#d1d5db"}
                        />
                      ))}
                    </div>
                    <span className="intern-feedback-date">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="intern-feedback-msg">{fb.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
