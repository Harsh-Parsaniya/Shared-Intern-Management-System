"use server";

import { cookies } from "next/headers";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createToken } from "@/lib/auth-utils";
import { comparePassword, hashPassword } from "@/lib/password-utils";
import { Role } from "@/types";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;


  const _password = formData.get("password") as string;

  // MOCK AUTHENTICATION LOGIC
  // In a real app, you would fetch the user from Hasura/PostgreSQL
  // and compare the input password with the stored hash.

  // Mock stored hash (hash of 'admin123')
  // const MOCK_ADMIN_HASH = "$2a$10$w66yP9lX.0U8X/xZ8X.X.uX8X.X.uX8X.X.uX8X.X.uX8X.X.u"; 

  // For the sake of this mock, we'll "verify" any password if the email matches admin/dept
  // but show the comparison logic.

  let role: Role = 'intern';
  const userId = 'mock-user-id';
  let departmentId = null;

  if (email.includes('admin')) {
    role = 'admin';
  } else if (email.includes('dept')) {
    role = 'department';
    departmentId = 'mock-dept-id';
  }

  // Example of how comparison would work:
  // const isValid = await comparePassword(password, userFromDb.password);
  // if (!isValid) return { success: false, error: 'Invalid password' };

  const token = await createToken({ 
    userId, 
    role, 
    departmentId 
  });

  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: false, // Set to false so Apollo Client can read it on the client side
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2 hours
    path: "/",
  });

  return { success: true, role, error: null };
}

export async function signUpAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as Role) || 'intern';

  // In a real app, you would save user to database here
  await hashPassword(password); // Just to simulate work

  // MOCK SAVE LOGIC
  // In a real app, you would save this to Hasura/PostgreSQL
  console.log(`User signed up: ${name} (${email}) with role ${role}`);

  // Auto-login after sign up
  const userId = 'new-user-id';
  const token = await createToken({ 
    userId, 
    role, 
    departmentId: null 
  });

  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2,
    path: "/",
  });

  return { success: true, role, error: null };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}
