import { NextResponse, type NextRequest } from "next/server"

import { COOKIE_NAME } from "./lib/session"

// Optimistic only: this checks that a session cookie is *present*, never that
// it is valid. Its job is to bounce signed-out visitors to the login page
// without a database round trip. Real authorisation lives in lib/dal.ts.

const PUBLIC_PATHS = ["/login"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasCookie = Boolean(request.cookies.get(COOKIE_NAME)?.value)
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!hasCookie && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    // Remember where they were headed so login can return them there.
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  if (hasCookie && isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Everything except Next's internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
}
