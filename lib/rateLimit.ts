// Fixed-window rate limiter held in process memory.
//
// Counters are per-instance, so a serverless or multi-replica deployment gets
// one window per replica and loses them on cold start. That is enough to stop
// a single client hammering the plan generators (each request runs hundreds of
// scoring passes over a DB result set), but a distributed store is required if
// this ever needs to be an actual quota.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// The map is keyed by client IP, so without eviction a long-lived process
// accumulates one entry per address seen. Sweeping on write keeps it bounded
// without a timer.
const SWEEP_EVERY = 500;
let writesSinceSweep = 0;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (++writesSinceSweep >= SWEEP_EVERY) {
    writesSinceSweep = 0;
    sweep(now);
  }

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// x-forwarded-for is only trustworthy behind a proxy that overwrites it. Every
// request that arrives without one shares the "unknown" bucket, which fails
// closed rather than open.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests(retryAfterSeconds: number) {
  const wait =
    retryAfterSeconds >= 60
      ? "a minute"
      : `${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}`;

  return Response.json(
    {
      ok: false,
      error: `You have generated several plans in a row. Try again in ${wait}.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
