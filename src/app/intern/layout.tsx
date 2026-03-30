"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { InternSidebar } from "@/components/intern/intern-sidebar";
import { ReactNode, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setInternData } from "@/store/intern-slice";
import { useQuery } from "@apollo/client/react";
import { GET_INTERN_DASHBOARD_DATA } from "@/lib/graphql";

function InternLayoutInner({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const [userId, setUserId] = useState("");

  // Read cookie only on client side
  useEffect(() => {
    const value = `; ${document.cookie}`;
    const parts = value.split("; auth-token=");
    if (parts.length === 2) {
      const token = parts.pop()?.split(";").shift();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserId(payload.userId || "");
          // Seed name/email from JWT while GraphQL loads
          if (payload.name) {
            dispatch(setInternData({ name: payload.name, email: payload.email || "", userId: payload.userId || "" }));
          }
        } catch {
          // ignore
        }
      }
    }
  }, [dispatch]);

  const { data } = useQuery<any>(GET_INTERN_DASHBOARD_DATA, {
    variables: { userId },
    skip: !userId,
  });

  useEffect(() => {
    if (data?.interns?.[0]) {
      const intern = data.interns[0];
      dispatch(
        setInternData({
          name: intern.user?.name || "",
          email: intern.user?.email || "",
          department: intern.department?.name || "",
          collegeName: intern.college_name || "",
          startDate: intern.start_date || "",
          endDate: intern.end_date || "",
          internId: intern.id || "",
          userId,
        })
      );
    }
  }, [data, dispatch, userId]);

  return (
    <div className="intern-layout">
      <InternSidebar />
      <main className="intern-main">
        <div className="intern-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function InternLayout({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <InternLayoutInner>{children}</InternLayoutInner>
    </Provider>
  );
}
