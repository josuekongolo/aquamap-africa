// Minimal in-memory per-IP rate limiter for the public API proxies.
// Fluid Compute reuses instances across requests, so this catches casual abuse
// without external infra; a determined attacker is Vercel WAF territory.
const buckets = new Map();

export function rateLimit(request, { limit = 30, windowMs = 60_000 } = {}) {
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(ip, { start: now, count: 1 });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfter: Math.ceil((bucket.start + windowMs - now) / 1000) };
  return { ok: true };
}

export const tooMany = (retryAfter) =>
  new Response(JSON.stringify({ error: 'rate_limited' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter || 60) },
  });
