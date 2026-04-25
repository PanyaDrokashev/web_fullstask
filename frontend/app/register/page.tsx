import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const isAuthorized = cookieStore.get("bruska_authorized")?.value === "1";
  const role = cookieStore.get("bruska_role")?.value ?? "";

  if (isAuthorized) {
    redirect(role.toLowerCase() === "admin" ? "/admin" : "/");
  }

  return <RegisterForm />;
}
