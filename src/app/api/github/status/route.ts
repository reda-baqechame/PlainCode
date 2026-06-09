import { NextRequest, NextResponse } from "next/server";
import { isOAuthConfigured, GH_TOKEN_COOKIE } from "@/lib/github/oauth";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: isOAuthConfigured(),
    connected: Boolean(req.cookies.get(GH_TOKEN_COOKIE)?.value),
  });
}
