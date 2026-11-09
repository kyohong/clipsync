const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const encoder = new TextEncoder();
const MAX_TEXT_LENGTH = 200000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const room = (url.searchParams.get("room") || "").trim();
    if (!room) return json({ error: "room required" }, 400);

    const id = env.CLIP_ROOM.idFromName(room);
    const obj = env.CLIP_ROOM.get(id);
    return obj.fetch(request);
  },
};

export class ClipRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/events") return this.handleEvents(request);
    if (url.pathname === "/send" && request.method === "POST") return this.handleSend(request);

    return new Response("Not Found", { status: 404, headers: CORS });
  }

  handleEvents(request) {
    const { readable, writable } = new TransformStream();
    const session = { writer: writable.getWriter() };

    this.sessions.add(session);
    this.write(session, `data: ${JSON.stringify({ status: "connected" })}\n\n`);

    const ping = setInterval(() => this.write(session, ": ping\n\n"), 25000);

    request.signal.addEventListener("abort", () => {
      clearInterval(ping);
      this.sessions.delete(session);
      session.writer.close().catch(() => {});
    });

    return new Response(readable, {
      headers: {
        ...CORS,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  async handleSend(request) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const text = body?.text;
    if (typeof text !== "string") return json({ error: "text required" }, 400);
    if (text.length > MAX_TEXT_LENGTH) return json({ error: "text too large" }, 413);

    const payload = `data: ${JSON.stringify({ text })}\n\n`;
    const targets = [...this.sessions];

    for (const session of targets) this.write(session, payload);

    return json({ success: true, delivered: targets.length, count: targets.length });
  }

  write(session, chunk) {
    session.writer.write(encoder.encode(chunk)).catch(() => {
      this.sessions.delete(session);
    });
  }
}
