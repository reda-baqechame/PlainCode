import { NextResponse } from "next/server";
import { GH_TOKEN_COOKIE } from "@/lib/github/oauth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(GH_TOKEN_COOKIE);
  return res;
}
