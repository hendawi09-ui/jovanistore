import { NextResponse } from "next/server";

const REALM = "Jovani Admin";
const ADMIN_USER = "admin";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/products") && req.method === "GET") {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  let debug = {
    gotAuthHeader: !!auth,
    scheme: null,
    decodeOk: false,
    receivedUser: null,
    receivedPassLength: null,
    envPasswordSet: !!process.env.ADMIN_PASSWORD,
    envPasswordLength: process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0,
  };

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    debug.scheme = scheme;
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded);
        const idx = decoded.indexOf(":");
        const user = decoded.slice(0, idx);
        const pass = decoded.slice(idx + 1);
        debug.decodeOk = true;
        debug.receivedUser = user;
        debug.receivedPassLength = pass.length;
        if (user === ADMIN_USER && pass === process.env.ADMIN_PASSWORD) {
          return NextResponse.next();
        }
      } catch (e) {
        debug.error = String(e);
      }
    }
  }

  return new NextResponse(
    "Authentication required\n\nDEBUG:\n" + JSON.stringify(debug, null, 2),
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Basic realm="${REALM}"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}

export const config = {
  matcher: ["/admin/:path*", "/api/products/:path*"],
};

