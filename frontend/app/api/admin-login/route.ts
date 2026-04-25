import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/shared/api/base-url";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const backendResp = await fetch(`${getBackendApiBaseUrl()}/auth/session`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!backendResp.ok) {
    return NextResponse.json({ error: "Неверный токен авторизации" }, { status: 401 });
  }

  const session = (await backendResp.json()) as {
    uid?: string;
    email?: string;
    name?: string;
    role?: string;
  };

  const role = (session.role ?? "user").toLowerCase();
  const displayName = session.name || session.email || "Пользователь";

  const response = NextResponse.json({
    success: true,
    role,
    user: displayName,
  });

  response.cookies.set("bruska_authorized", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set("bruska_user", displayName, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set("bruska_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set("bruska_uid", session.uid ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
