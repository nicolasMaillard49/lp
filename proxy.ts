import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/adminAuth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Le login est toujours accessible.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_COOKIE_SECRET;

  // Dev sans secret configuré : on laisse passer pour pouvoir prévisualiser.
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return deny(req, pathname);
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (await verifyToken(token, secret)) return NextResponse.next();

  return deny(req, pathname);
}

function deny(req: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
