import { NextResponse, type NextRequest } from "next/server";
import {
  createEdgeAnonymousSession,
  SESSION_MAX_AGE_SECONDS,
  verifyEdgeAnonymousSession,
} from "@/lib/auth/edge-session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { validateAdminAuthorization } from "@/lib/auth/admin";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Admin access is not configured" },
        { status: 503 },
      );
    }
    if (!validateAdminAuthorization(request.headers.get("authorization"), username, password)) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Quit Smoking Metrics"' },
      });
    }
  }

  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    const identity =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous";
    const intervention = request.nextUrl.pathname.endsWith("/intervention");
    const result = consumeRateLimit(
      `${identity}:${intervention ? "intervention" : "mutation"}`,
      intervention ? 10 : 30,
      60_000,
    );
    if (!result.allowed) {
      return NextResponse.json(
        { error: "操作太频繁，请稍后再试" },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        },
      );
    }
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server session configuration is missing" },
      { status: 503 },
    );
  }

  const currentValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (currentValue && (await verifyEdgeAnonymousSession(currentValue, secret))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE_NAME, await createEdgeAnonymousSession(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
