import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const token = (await cookieStore).get("auth-token")?.value;

  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
