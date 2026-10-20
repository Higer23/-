const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, {headers: CORS});
    const url = new URL(request.url);
    if (url.pathname !== '/api/entries') return new Response('Not found', {status: 404, headers: CORS});

    if (request.method === 'GET') {
      const {results} = await env.DB.prepare('SELECT name, message, created_at FROM entries ORDER BY id DESC LIMIT 50').all();
      return Response.json(results, {headers: CORS});
    }

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return Response.json({error: 'bad json'}, {status: 400, headers: CORS}); }
      const name = String(body.name || '').trim().slice(0, 40);
      const message = String(body.message || '').trim().slice(0, 500);
      if (!name || !message) return Response.json({error: 'eksik alan'}, {status: 400, headers: CORS});
      await env.DB.prepare('INSERT INTO entries (name, message) VALUES (?, ?)').bind(name, message).run();
      return Response.json({ok: true}, {status: 201, headers: CORS});
    }

    return new Response('Method not allowed', {status: 405, headers: CORS});
  }
};
