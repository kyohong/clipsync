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
const TOKEN_PATTERN = /^tk_[A-Za-z0-9_-]{8,64}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function forbidden() {
  return json({ error: "forbidden" }, 403);
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
    this.activeToken = null;
    this.isChatMode = false;
    this.hostId = null;
  }

  readToken(request, url) {
    return (url.searchParams.get("token") || request.headers.get("x-clipsync-token") || "").trim();
  }

  isAuthorized(token) {
    if (!this.isChatMode) return true;
    return Boolean(token) && token === this.activeToken;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const token = this.readToken(request, url);

    if (url.pathname === "/chat/open" && request.method === "POST") {
      return this.handleChatOpen(request);
    }
    if (url.pathname === "/events") {
      if (!this.isAuthorized(token)) return forbidden();
      return this.handleEvents(request);
    }
    if (url.pathname === "/send" && request.method === "POST") {
      if (!this.isAuthorized(token)) return forbidden();
      return this.handleSend(request, token);
    }

    return new Response("Not Found", { status: 404, headers: CORS });
  }

  async handleChatOpen(request) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!TOKEN_PATTERN.test(token)) return json({ error: "invalid token" }, 400);

    if (this.isChatMode && this.activeToken && this.activeToken !== token) {
      return json({ error: "room occupied" }, 403);
    }

    this.isChatMode = true;
    this.activeToken = token;
    this.hostId = token;
    return json({ ok: true });
  }

  handleEvents(request) {
    const { readable, writable } = new TransformStream();
    const session = { writer: writable.getWriter(), ping: null };

    this.sessions.add(session);
    this.write(session, `data: ${JSON.stringify({ status: "connected" })}\n\n`);

    session.ping = setInterval(() => this.write(session, ": ping\n\n"), 25000);

    request.signal.addEventListener("abort", () => {
      clearInterval(session.ping);
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

  async handleSend(request, token) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (body?.type === "system") {
      if (body.action === "room_destroy") {
        if (!this.isChatMode || token !== this.activeToken) return forbidden();
        await this.destroyRoom();
        return json({ ok: true, destroyed: true });
      }
      return json({ error: "unknown action" }, 400);
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
    if (typeof body?.sender === "string" && body.sender) {
      message.sender = body.sender.slice(0, 64);
    }

    const targets = [...this.sessions];
    const frame = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
    for (const session of targets) this.write(session, frame);

    return json({ success: true, delivered: targets.length, count: targets.length });
  }

  destroyRoom() {
    const frame = encoder.encode(
      `data: ${JSON.stringify({ type: "system", event: "room_destroyed" })}\n\n`
    );

    for (const session of [...this.sessions]) {
      clearInterval(session.ping);
      this.write(session, frame);
      session.writer.close().catch(() => {});
      this.sessions.delete(session);
    }

    this.activeToken = null;
    this.isChatMode = false;
    this.hostId = null;
  }

  write(session, chunk) {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    session.writer.write(bytes).catch(() => {
      this.sessions.delete(session);
    });
  }
}
