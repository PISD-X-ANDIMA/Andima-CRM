import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Exposes the pathname to server layouts. Authorization lives in app/dashboard/layout.tsx. */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
