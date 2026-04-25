import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.delete("bruska_authorized");
  response.cookies.delete("bruska_user");
  response.cookies.delete("bruska_role");
  response.cookies.delete("bruska_uid");

  return response;
}
