import { NextResponse } from "next/server";

// In-memory fixed-window rate limiter. PlainCode deploys as a single persistent
// Node process (Railway), so module-level state is shared across requests. This
// is intentionally simple — it protects against scripted abuse / runaway cost on
// a free, no-signup app, not against a distributed attacker.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number; // seconds
}

function sweep(now: number): void {
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit = 30, windowMs = 60_000): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > MAX_BUCKETS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count++;
  return { allowed: true, retryAfter: 0 };
}

// Test-only helper to reset state between cases.
export function __resetRateLimit(): void {
  buckets.clear();
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * Guards an API route. Returns a 429 NextResponse when the caller is over the
 * limit, or null when the request may proceed.
 */
export function enforceRateLimit(
  req: Request,
  scope: string,
  limit = 30,
  windowMs = 60_000
): NextResponse | null {
  const ip = getClientIp(req);
  const result = rateLimit(`${scope}:${ip}`, limit, windowMs);
  return result.allowed ? null : rateLimitResponse(result.retryAfter);
}
