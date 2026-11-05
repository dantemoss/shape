type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function clearRateLimits(): void {
  buckets.clear();
}

/** True si el pedido entra en el cupo. La ventana es fija por clave. */
export function allowRequest(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  const raw = first || request.headers.get("x-real-ip")?.trim() || "local";
  return raw.slice(0, 80);
}
