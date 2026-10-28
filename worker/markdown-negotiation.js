const MD_URL = "https://higer23.github.io/-/index.md";

// Serves the homepage as Markdown when a client sends "Accept: text/markdown".
// Every other request is passed through to the origin unchanged.
export default {
  async fetch(request) {
    const accept = request.headers.get("Accept") || "";
    if (request.method === "GET" && accept.includes("text/markdown")) {
      const r = await fetch(MD_URL, { cf: { cacheTtl: 300, cacheEverything: true } });
      if (r.ok) {
        const h = new Headers();
        h.set("Content-Type", "text/markdown; charset=utf-8");
        h.set("Vary", "Accept");
        h.set("Cache-Control", "public, max-age=300");
        h.set("X-Content-Type-Options", "nosniff");
        return new Response(r.body, { status: 200, headers: h });
      }
    }
    const res = await fetch(request);
    const h = new Headers(res.headers);
    const vary = h.get("Vary");
    h.set("Vary", vary ? vary + ", Accept" : "Accept");
    return new Response(res.body, { status: res.status, headers: h });
  },
};
