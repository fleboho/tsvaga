import { prisma } from './db';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window rate limiter backed by Postgres.
 *
 * Stored in the database (not memory) so limits hold across serverless
 * instances. Fails open if the database is unreachable — availability is
 * preferred over blocking traffic when storage is down.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowEnds = new Date(now + windowMs);

  try {
    const rows = await prisma.$queryRaw<{ count: number; windowEnds: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "windowEnds")
      VALUES (${key}, 1, ${windowEnds})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."windowEnds" <= NOW() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "windowEnds" = CASE
          WHEN "RateLimit"."windowEnds" <= NOW() THEN ${windowEnds}
          ELSE "RateLimit"."windowEnds"
        END
      RETURNING "count", "windowEnds"
    `;

    // Opportunistic cleanup of stale counters (~1% of requests).
    if (Math.random() < 0.01) {
      prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "windowEnds" < NOW() - INTERVAL '1 day'`.catch(
        () => {}
      );
    }

    const row = rows[0];
    if (!row) return { allowed: true, remaining: limit, retryAfterSeconds: 0 };

    const remaining = Math.max(0, limit - row.count);
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((new Date(row.windowEnds).getTime() - now) / 1000)
    );

    return { allowed: row.count <= limit, remaining, retryAfterSeconds };
  } catch (error) {
    console.error('[rate-limit] check failed, allowing request', error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Best-effort client IP from proxy headers. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** 429 helper shared by API routes. */
export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  );
}
