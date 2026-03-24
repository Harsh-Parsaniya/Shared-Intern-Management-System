"use server";

import { cookies } from "next/headers";
import { createToken } from "@/lib/auth-utils";
import { comparePassword, hashPassword } from "@/lib/password-utils";
import { Role } from "@/types";
import { client } from "@/lib/apollo-client";
import { LOGIN_USER, SIGN_UP_USER } from "@/lib/graphql";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { data } = await client.query({
      query: LOGIN_USER,
      variables: { email },
      fetchPolicy: "no-cache",
    });

    const user = data?.users?.[0];

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    const token = await createToken({
      userId: user.id,
      role: user.role as Role,
      departmentId: user.department_id,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: false, // Accessible by client-side Apollo Client
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return { success: true, role: user.role, error: null };
  } catch (err: any) {
    console.error("Login error:", err);
    return { success: false, error: "An error occurred during login" };
  }
}

export async function signUpAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as Role) || "intern";

  try {
    const hashedPassword = await hashPassword(password);

    const { data } = await client.mutate({
      mutation: SIGN_UP_USER,
      variables: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    const newUser = data?.insert_users_one;

    if (!newUser) {
      return { success: false, error: "Failed to create user" };
    }

    // Auto-login after sign up
    const token = await createToken({
      userId: newUser.id,
      role: newUser.role as Role,
      departmentId: null,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2,
      path: "/",
    });

    return { success: true, role: newUser.role, error: null };
  } catch (err: any) {
    console.error("Signup error:", err);
    if (err.message?.includes("Uniqueness violation")) {
      return { success: false, error: "Email already exists" };
    }
    return { success: false, error: "An error occurred during sign up" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}
