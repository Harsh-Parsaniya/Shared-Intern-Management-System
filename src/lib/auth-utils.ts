import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-very-secure-secret-key-change-me"
);

export async function createToken(payload: {
  userId: string;
  role: Role;
  departmentId?: string | null;
  name: string;
  email: string;
}) {
  const { userId, role, departmentId, name, email } = payload;

  const hasuraClaims = {
    "x-hasura-allowed-roles": [role],
    "x-hasura-default-role": role,
    "x-hasura-user-id": userId,
    "x-hasura-department-id": departmentId || "",
  };

  return await new SignJWT({
    "https://hasura.io/jwt/claims": hasuraClaims,
    userId,
    role,
    departmentId,
    name,
    email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown;
  } catch {
    return null;
  }
}
