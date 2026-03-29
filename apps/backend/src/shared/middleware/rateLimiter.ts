import { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis.js';

/**
 * Rate limiter using Redis. Limits requests per user per window.
 * @param keyPrefix - Redis key prefix (e.g., 'sos', 'login')
 * @param maxRequests - Max requests allowed in the window
 * @param windowSeconds - Time window in seconds
 */
export function rateLimiter(keyPrefix: string, maxRequests: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;
    if (!userId) return next();

    const key = `ratelimit:${keyPrefix}:${userId}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        res.status(429).json({
          success: false,
          message: `Too many requests. Please wait ${ttl > 0 ? ttl : windowSeconds} seconds before trying again.`,
        });
        return;
      }

      next();
    } catch {
      // If Redis fails, allow the request through
      next();
    }
  };
}
