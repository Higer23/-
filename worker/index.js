const ALLOWED_METHODS = "GET,POST,DELETE,OPTIONS";
const MAX_BODY_BYTES = 4096;
const MAX_NAME_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 500;
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX_POSTS = 5;

function response(data, status = 200, origin = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = ALLOWED_METHODS;
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = aa.length ^ bb.length;
  const max = Math.max(aa.length, bb.length);
  for (let i = 0; i < max; i++) diff |= (aa[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}

async function hashIp(ip) {
  const bytes = new TextEncoder().encode(ip.trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readJson(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
  return JSON.parse(text);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://higer23.github.io";

    if (origin && origin !== allowedOrigin) return response({ error: "Origin not allowed" }, 403);
    const corsOrigin = origin === allowedOrigin ? allowedOrigin : null;

    if (request.method === "OPTIONS") {
      if (!corsOrigin) return new Response(null, { status: 204 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": ALLOWED_METHODS,
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin",
        },
      });
    }

    if (!url.pathname.startsWith("/api/")) return response({ error: "Not found" }, 404, corsOrigin);
    if (!env.DB) return response({ error: "Service unavailable" }, 503, corsOrigin);

    try {
      const clientIp = request.headers.get("CF-Connecting-IP");
      const clientHash = clientIp ? await hashIp(clientIp) : null;

      if (clientHash) {
        const ban = await env.DB.prepare("SELECT 1 FROM banned_ips WHERE ip_hash = ? LIMIT 1").bind(clientHash).first();
        if (ban) return response({ error: "Bu bağlantı adresi engellenmiş." }, 403, corsOrigin);
      }

      if (url.pathname === "/api/entries" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT id, name, message, created_at FROM entries ORDER BY id DESC LIMIT 50"
        ).all();
        return response(results || [], 200, corsOrigin);
      }

      if (url.pathname === "/api/entries" && request.method === "POST") {
        if (!clientHash) return response({ error: "İstemci doğrulanamadı." }, 503, corsOrigin);
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare("DELETE FROM post_limits WHERE created_at < ?").bind(now - RATE_WINDOW_SECONDS).run();
        const count = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM post_limits WHERE ip_hash = ? AND created_at > ?"
        ).bind(clientHash, now - RATE_WINDOW_SECONDS).first();
        if ((count?.count || 0) >= RATE_MAX_POSTS) {
          return response({ error: "Çok sık mesaj gönderildi. Bir dakika sonra tekrar dene." }, 429, corsOrigin);
        }

        let body;
        try { body = await readJson(request); }
        catch (error) {
          return response({ error: error.message === "BODY_TOO_LARGE" ? "İstek çok büyük." : "Geçersiz JSON." }, 400, corsOrigin);
        }
        const name = String(body?.name || "").trim().slice(0, MAX_NAME_LENGTH);
        const message = String(body?.message || "").trim().slice(0, MAX_MESSAGE_LENGTH);
        if (!name || !message) return response({ error: "Ad ve mesaj zorunludur." }, 400, corsOrigin);

        await env.DB.batch([
          env.DB.prepare("INSERT INTO post_limits (ip_hash, created_at) VALUES (?, ?)").bind(clientHash, now),
          env.DB.prepare("INSERT INTO entries (name, message, ip_hash) VALUES (?, ?, ?)").bind(name, message, clientHash),
        ]);
        return response({ ok: true }, 201, corsOrigin);
      }

      const banMatch = url.pathname.match(/^\/api\/entries\/(\d+)\/ban$/);
      const deleteMatch = url.pathname.match(/^\/api\/entries\/(\d+)$/);
      if ((banMatch && request.method === "POST") || (deleteMatch && request.method === "DELETE")) {
        if (!env.ADMIN_PASSWORD) return response({ error: "Yönetici işlemleri yapılandırılmamış." }, 503, corsOrigin);
        let body;
        try { body = await readJson(request); }
        catch { return response({ error: "Geçersiz istek." }, 400, corsOrigin); }
        if (!constantTimeEqual(String(body?.password || ""), env.ADMIN_PASSWORD)) {
          return response({ error: "Yönetici parolası hatalı." }, 401, corsOrigin);
        }

        const id = Number((banMatch || deleteMatch)[1]);
        const entry = await env.DB.prepare("SELECT id, ip_hash FROM entries WHERE id = ?").bind(id).first();
        if (!entry) return response({ error: "Mesaj bulunamadı." }, 404, corsOrigin);

        if (banMatch) {
          if (!entry.ip_hash) return response({ error: "Bu mesaj için engellenecek adres kaydı yok." }, 409, corsOrigin);
          await env.DB.prepare(
            "INSERT INTO banned_ips (ip_hash, reason) VALUES (?, ?) ON CONFLICT(ip_hash) DO NOTHING"
          ).bind(entry.ip_hash, "Forum mesajı yönetici tarafından engellendi").run();
          return response({ ok: true, action: "banned" }, 200, corsOrigin);
        }

        await env.DB.prepare("DELETE FROM entries WHERE id = ?").bind(id).run();
        return response({ ok: true, action: "deleted" }, 200, corsOrigin);
      }

      return response({ error: "Not found" }, 404, corsOrigin);
    } catch {
      return response({ error: "Sunucu hatası. Lütfen daha sonra tekrar dene." }, 500, corsOrigin);
    }
  },
};
