import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, isOAuthConfigured, GH_STATE_COOKIE } from "@/lib/github/oauth";

export async function GET(req: NextRequest) {
  if (!isOAuthConfigured()) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured on this server." },
      { status: 503 }
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID as string;
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/github/callback`;
  const state = crypto.randomUUID();

  const url = buildAuthorizeUrl({ clientId, redirectUri, state });

  const res = NextResponse.redirect(url);
  res.cookies.set(GH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
