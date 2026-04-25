import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const isAuthorized = cookieStore.get("bruska_authorized")?.value === "1";
  const userName = cookieStore.get("bruska_user")?.value ?? "";
  const role = cookieStore.get("bruska_role")?.value ?? "";
  const isAdmin = isAuthorized && role.toLowerCase() === "admin";

  if (!isAdmin) {
    redirect("/login");
  }

  return { userName, role };
}
