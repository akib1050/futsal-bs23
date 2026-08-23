import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, decryptSession } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register"];
const ADMIN_PATHS = ["/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await decryptSession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!session && !isPublic) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/me", req.url));
  }

  if (
    session?.role !== "ADMIN" &&
    ADMIN_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/me", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
