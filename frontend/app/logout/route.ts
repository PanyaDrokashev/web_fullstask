import { NextRequest, NextResponse } from "next/server";

function clearAuthCookies(response: NextResponse) {
  response.cookies.set("bruska_authorized", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("bruska_user", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("bruska_role", "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("bruska_uid", "", {
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl);

  clearAuthCookies(response);
  return response;
}
