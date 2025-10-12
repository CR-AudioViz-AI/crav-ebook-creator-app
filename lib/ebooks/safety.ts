import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
});

const idempotencyCache = new Map<string, { data: any; timestamp: number }>();

const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  const entries = Array.from(idempotencyCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

export async function rateLimit(key: string): Promise<void> {
  try {
    await rateLimiter.consume(key);
  } catch (error) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
}

export function useIdempotency(key?: string) {
  if (!key) {
    return { hit: false };
  }

  const cached = idempotencyCache.get(key);
  if (cached) {
    return {
      hit: true,
      data: cached.data,
    };
  }

  return {
    hit: false,
    set: (data: any) => {
      idempotencyCache.set(key, {
        data,
        timestamp: Date.now(),
      });
    },
  };
}

export function getClientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
