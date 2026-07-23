export class RateLimitManager {
  private buckets = new Map<string, { remaining: number; resetAt: number }>();

  public check(bucketKey: string, limit = 5, windowMs = 60000): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const b = this.buckets.get(bucketKey);

    if (!b || b.resetAt <= now) {
      this.buckets.set(bucketKey, { remaining: limit - 1, resetAt: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    if (b.remaining > 0) {
      b.remaining--;
      return { allowed: true, retryAfter: 0 };
    }

    return { allowed: false, retryAfter: b.resetAt - now };
  }
}
