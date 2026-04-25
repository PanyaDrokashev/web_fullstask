import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AdminLoginForm from "@/app/admin-login/AdminLoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const isAuthorized = cookieStore.get("bruska_authorized")?.value === "1";
  const role = cookieStore.get("bruska_role")?.value ?? "";
  const isAdmin = isAuthorized && role.toLowerCase() === "admin";

  if (isAdmin) {
    redirect("/admin");
  }
  if (isAuthorized) {
    redirect("/");
  }

  return <AdminLoginForm />;
}
