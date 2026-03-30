"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { DeptSidebar } from "@/components/dept/dept-sidebar";
import { ReactNode, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setDeptData } from "@/store/dept-slice";
import { useQuery } from "@apollo/client/react";
import { GET_DEPARTMENT_BY_ID } from "@/lib/graphql";

function DeptLayoutInner({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const [deptId, setDeptId] = useState("");

  // Read cookie only on the client
  useEffect(() => {
    const value = `; ${document.cookie}`;
    const parts = value.split("; auth-token=");
    if (parts.length === 2) {
      const token = parts.pop()?.split(";").shift();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setDeptId(payload.departmentId || "");
          dispatch(setDeptData({ userId: payload.userId || "", deptId: payload.departmentId || "" }));
        } catch {
          // ignore
        }
      }
    }
  }, [dispatch]);

  // Fetch department name once we have the id
  const { data } = useQuery<any>(GET_DEPARTMENT_BY_ID, {
    variables: { id: deptId },
    skip: !deptId,
  });

  useEffect(() => {
    if (data?.departments_by_pk?.name) {
      dispatch(setDeptData({ deptName: data.departments_by_pk.name }));
    }
  }, [data, dispatch]);

  return (
    <div className="dept-layout">
      <DeptSidebar />
      <main className="dept-main">
        <div className="dept-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DeptLayout({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <DeptLayoutInner>{children}</DeptLayoutInner>
    </Provider>
  );
}
