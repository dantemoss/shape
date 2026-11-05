const RETRYABLE_STATUS = new Set([408, 502, 503, 504]);

export function isIdempotentMethod(method: string | undefined): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD";
}

function parentAborted(signal: AbortSignal | null | undefined): boolean {
  return Boolean(signal?.aborted);
}

function abortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

async function fetchOnce(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  doFetch: typeof fetch,
  timeoutMs: number,
): Promise<Response> {
  if (parentAborted(init?.signal)) throw abortError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onParentAbort = () => controller.abort();
  init?.signal?.addEventListener("abort", onParentAbort);

  try {
    return await doFetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", onParentAbort);
  }
}

/**
 * A dead route (IPv6 blackhole, stalled HTTP/2) can sit until the browser
 * gives up, which is often around three minutes. Abort sooner and, for
 * reads only, open one fresh connection. Writes are not retried.
 */
export async function fetchWithDeadline(
  input: RequestInfo | URL,
  init?: RequestInit,
  doFetch: typeof fetch = fetch,
  timeoutMs = 12_000,
): Promise<Response> {
  const retry = isIdempotentMethod(init?.method);
  const attempts = retry ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (parentAborted(init?.signal)) throw abortError();
    try {
      const response = await fetchOnce(input, init, doFetch, timeoutMs);
      if (retry && attempt === 0 && RETRYABLE_STATUS.has(response.status)) continue;
      return response;
    } catch (error) {
      lastError = error;
      if (parentAborted(init?.signal) || !retry || attempt === attempts - 1) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("La solicitud no se completó.");
}
