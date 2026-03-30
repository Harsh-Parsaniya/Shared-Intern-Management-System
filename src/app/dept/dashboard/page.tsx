"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery } from "@apollo/client/react";
import { GET_DEPT_DASHBOARD_STATS, GET_FEEDBACK } from "@/lib/graphql";
import { Users, MessageSquare, Building2, TrendingUp, Star, Quote } from "lucide-react";

export default function DeptDashboardPage() {
  const { deptId } = useSelector((state: RootState) => state.dept);

  const { data: statsData } = useQuery<any>(GET_DEPT_DASHBOARD_STATS, {
    variables: { departmentId: deptId },
    skip: !deptId,
  });

  const { data: feedbackData } = useQuery<any>(GET_FEEDBACK);

  // Filter feedback to only this department
  const allFeedback = feedbackData?.feedback || [];
  const deptFeedback = allFeedback.filter((fb: any) => fb.intern.department_id === deptId);

  const internCount = statsData?.interns_aggregate?.aggregate?.count || 0;
  const feedbackCount = statsData?.feedback_aggregate?.aggregate?.count || 0;
  const recentInterns = statsData?.recent_interns || [];

  return (
    <div className="dept-page">

      {/* Page title */}
      <div>
        <h1 className="dept-page-title">
          Department <span className="dept-title-highlight">Dashboard</span>
        </h1>
        <p className="dept-page-subtitle">Management overview for your department's interns.</p>
      </div>

      {/* Stat cards */}
      <div className="dept-stats-grid">
        <div className="dept-stat-card">
          <div className="dept-stat-top">
            <div className="dept-stat-icon dept-icon-indigo">
              <Users size={22} />
            </div>
            <span className="dept-live-badge">
              <TrendingUp size={12} /> Live
            </span>
          </div>
          <p className="dept-stat-label">My Interns</p>
          <p className="dept-stat-value">{internCount}</p>
        </div>

        <div className="dept-stat-card">
          <div className="dept-stat-top">
            <div className="dept-stat-icon dept-icon-violet">
              <MessageSquare size={22} />
            </div>
            <span className="dept-live-badge">
              <TrendingUp size={12} /> Live
            </span>
          </div>
          <p className="dept-stat-label">Dept Feedback</p>
          <p className="dept-stat-value">{feedbackCount}</p>
        </div>

        <div className="dept-stat-card">
          <div className="dept-stat-top">
            <div className="dept-stat-icon dept-icon-green">
              <Building2 size={22} />
            </div>
            <span className="dept-live-badge">
              <TrendingUp size={12} /> Live
            </span>
          </div>
          <p className="dept-stat-label">Department</p>
          <p className="dept-stat-value">Active</p>
        </div>
      </div>

      {/* Bottom grid: interns table + recent feedback */}
      <div className="dept-dashboard-grid">

        {/* Interns table */}
        <div className="dept-card">
          <h3 className="dept-section-title">Department Interns</h3>
          <table className="dept-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>College</th>
              </tr>
            </thead>
            <tbody>
              {recentInterns.length > 0 ? recentInterns.map((intern: any) => (
                <tr key={intern.id}>
                  <td className="dept-table-name">{intern.user.name}</td>
                  <td>{intern.college_name}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={2} className="dept-table-empty">No interns yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent feedback */}
        <div className="dept-card">
          <h3 className="dept-section-title">Recent Feedback</h3>
          <div className="dept-feedback-list">
            {deptFeedback.slice(0, 4).map((fb: any) => (
              <div key={fb.id} className="dept-feedback-item">
                <div className="dept-feedback-top">
                  <p className="dept-feedback-intern-name">{fb.intern.user.name.toUpperCase()}</p>
                  <div className="dept-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} fill={s <= fb.rating ? "#f59e0b" : "none"} color={s <= fb.rating ? "#f59e0b" : "#d1d5db"} />
                    ))}
                  </div>
                </div>
                <p className="dept-feedback-msg">{fb.message}</p>
                <p className="dept-feedback-date">{new Date(fb.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {deptFeedback.length === 0 && (
              <p className="dept-empty-text">No feedback yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
