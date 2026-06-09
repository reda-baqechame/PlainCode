import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/github/commit";
import { GH_STATE_COOKIE, GH_TOKEN_COOKIE } from "@/lib/github/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(GH_STATE_COOKIE)?.value;

  const docUrl = new URL("/document", req.nextUrl.origin);

  // CSRF protection: the state echoed back must match the one we issued.
  if (!code || !state || !expectedState || state !== expectedState) {
    docUrl.searchParams.set("gh", "error");
    const res = NextResponse.redirect(docUrl);
    res.cookies.delete(GH_STATE_COOKIE);
    return res;
  }

  const token = await exchangeCodeForToken(code);

  if (!token) {
    docUrl.searchParams.set("gh", "error");
    const res = NextResponse.redirect(docUrl);
    res.cookies.delete(GH_STATE_COOKIE);
    return res;
  }

  docUrl.searchParams.set("gh", "connected");
  const res = NextResponse.redirect(docUrl);
  res.cookies.delete(GH_STATE_COOKIE);
  res.cookies.set(GH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
