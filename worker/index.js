const ALLOWED_ORIGINS = new Set(["https://higer23.github.io", "https://me.higer.tech"]);
const ALLOWED_HOSTNAMES = new Set(["higer23.github.io", "me.higer.tech"]);
const VERIFY_PATH = "/api/turnstile/verify";
const MAX_BODY_BYTES = 4096;
const MAX_TOKEN_LENGTH = 2048;
const SITEVERIFY_TIMEOUT_MS = 10_000;

function json(data, status = 200, origin = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Vary": "Origin",
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }

  return new Response(JSON.stringify(data), { status, headers });
}

async function readBodyWithinLimit(request) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Preserve the intended 413 response even if cancellation fails.
        }
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== VERIFY_PATH) {
      return json({ error: "Not found" }, 404);
    }

    const origin = request.headers.get("Origin");
    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Origin not allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Cache-Control": "no-store",
          "Vary": "Origin",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json" }, 415, origin);
    }

    const clientIp = request.headers.get("CF-Connecting-IP");
    if (!clientIp || !env.VERIFY_RATE_LIMITER) {
      return json({ success: false, error: "Verifier is not configured" }, 503, origin);
    }

    try {
      const { success } = await env.VERIFY_RATE_LIMITER.limit({ key: clientIp });
      if (!success) {
        return json({ success: false, error: "Too many verification attempts" }, 429, origin);
      }
    } catch {
      // Fail closed: verification must not become an unmetered public endpoint.
      return json({ success: false, error: "Verification temporarily unavailable" }, 503, origin);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return json({ error: "Request too large" }, 413, origin);
    }

    let raw;
    try {
      raw = await readBodyWithinLimit(request);
    } catch {
      return json({ error: "Invalid JSON body" }, 400, origin);
    }
    if (raw === null) {
      return json({ error: "Request too large" }, 413, origin);
    }
    if (raw === undefined) {
      return json({ error: "Invalid JSON body" }, 400, origin);
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON body" }, 400, origin);
    }

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      return json({ success: false, error: "Invalid token" }, 400, origin);
    }

    if (!env.TURNSTILE_SECRET) {
      return json({ success: false, error: "Verifier is not configured" }, 503, origin);
    }

    try {
      const form = new URLSearchParams();
      form.set("secret", env.TURNSTILE_SECRET);
      form.set("response", token);

      const siteverify = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
          signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
        },
      );

      if (!siteverify.ok) {
        return json({ success: false, error: "Verification service unavailable" }, 502, origin);
      }

      const result = await siteverify.json();
      const success = result?.success === true && ALLOWED_HOSTNAMES.has(result?.hostname);

      return json(
        { success },
        success ? 200 : 403,
        true,
      );
    } catch {
      return json({ success: false, error: "Verification failed" }, 502, origin);
    }
  },
};
