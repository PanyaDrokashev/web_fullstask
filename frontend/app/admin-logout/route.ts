import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect("/");

  response.cookies.delete("bruska_authorized");
  response.cookies.delete("bruska_user");
  response.cookies.delete("bruska_role");
  response.cookies.delete("bruska_uid");

  return response;
}
