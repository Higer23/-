const ALLOWED_ORIGIN = "https://higer23.github.io";
const ALLOWED_HOSTNAME = "higer23.github.io";
const VERIFY_PATH = "/api/turnstile/verify";
const MAX_BODY_BYTES = 4096;
const MAX_TOKEN_LENGTH = 2048;

function json(data, status = 200, allowOrigin = false) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Vary": "Origin",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }

  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== VERIFY_PATH) {
      return json({ error: "Not found" }, 404);
    }

    const origin = request.headers.get("Origin");
    if (origin !== ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Cache-Control": "no-store",
          "Vary": "Origin",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, true);
    }

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json" }, 415, true);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ error: "Request too large" }, 413, true);
    }

    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return json({ error: "Request too large" }, 413, true);
      }
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON body" }, 400, true);
    }

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      return json({ success: false, error: "Invalid token" }, 400, true);
    }

    if (!env.TURNSTILE_SECRET) {
      return json({ success: false, error: "Verifier is not configured" }, 503, true);
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
        },
      );

      if (!siteverify.ok) {
        return json({ success: false, error: "Verification service unavailable" }, 502, true);
      }

      const result = await siteverify.json();
      const success = result?.success === true && result?.hostname === ALLOWED_HOSTNAME;

      return json(
        { success },
        success ? 200 : 403,
        true,
      );
    } catch {
      return json({ success: false, error: "Verification failed" }, 502, true);
    }
  },
};
