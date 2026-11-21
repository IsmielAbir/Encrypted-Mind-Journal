// Best-effort in-memory rate limiter. Cloudflare Workers reuse an isolate
// across multiple requests, so this meaningfully throttles sustained abuse
// from a given key, but it is per-isolate, not globally synchronized across
// Cloudflare's edge — it is a mitigation, not a hard guarantee. For stronger
// protection, pair this with a Cloudflare WAF rate-limiting rule.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > maxAttempts;
}

export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
}
