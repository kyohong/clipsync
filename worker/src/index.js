const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const encoder = new TextEncoder();
const MAX_TEXT_LENGTH = 200000;
const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
const MAX_MEDIA_CHARS = 12000000;

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

    const type = body?.type === "image" || body?.type === "file" ? body.type : "text";
    const content = typeof body?.content === "string" ? body.content : body?.text;
    if (typeof content !== "string") return json({ error: "content required" }, 400);

    if (type === "text") {
      if (content.length > MAX_TEXT_LENGTH) return json({ error: "text too large" }, 413);
    } else {
      if (!content.startsWith("data:")) return json({ error: "invalid content" }, 400);
      if (content.length > MAX_MEDIA_CHARS) return json({ error: "file too large" }, 413);
      if (Number(body?.size) > MAX_MEDIA_BYTES) return json({ error: "file too large" }, 413);
    }

    const message = { type, content, timestamp: Date.now() };
    if (type === "text") {
      message.text = content;
    } else {
      message.filename = typeof body?.filename === "string" ? body.filename.slice(0, 200) : "file";
      message.size = Number(body?.size) || 0;
    }

    const targets = [...this.sessions];
    const frame = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
    for (const session of targets) this.write(session, frame);

    return json({ success: true, delivered: targets.length, count: targets.length });
  }

  write(session, chunk) {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    session.writer.write(bytes).catch(() => {
      this.sessions.delete(session);
    });
  }
}
