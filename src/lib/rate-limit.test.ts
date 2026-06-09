import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, getClientIp, __resetRateLimit } from "./rate-limit";

beforeEach(() => __resetRateLimit());

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = "scope:1.2.3.4";
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    expect(rateLimit("a", 1).allowed).toBe(true);
    expect(rateLimit("a", 1).allowed).toBe(false);
    expect(rateLimit("b", 1).allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    const key = "scope:win";
    expect(rateLimit(key, 1, 1).allowed).toBe(true);
    expect(rateLimit(key, 1, 1).allowed).toBe(false);
    // Window is 1ms; wait a tick so the bucket expires.
    const until = Date.now() + 5;
    while (Date.now() < until) {
      /* spin briefly */
    }
    expect(rateLimit(key, 1, 1).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("reads the first x-forwarded-for entry", () => {
    const req = new Request("https://x", { headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" } });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });
  it("falls back to x-real-ip", () => {
    const req = new Request("https://x", { headers: { "x-real-ip": "8.8.8.8" } });
    expect(getClientIp(req)).toBe("8.8.8.8");
  });
  it("returns 'unknown' when no ip headers are present", () => {
    expect(getClientIp(new Request("https://x"))).toBe("unknown");
  });
});
