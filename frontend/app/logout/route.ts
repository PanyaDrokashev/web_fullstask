import { NextRequest, NextResponse } from "next/server";

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "http";

  if (host) {
    return `${proto}://${host}`;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Fallback below.
    }
  }

  return request.nextUrl.origin;
}

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
  const redirectUrl = new URL("/", getPublicOrigin(request));
  const response = NextResponse.redirect(redirectUrl);

  clearAuthCookies(response);
  return response;
}
