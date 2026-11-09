# ClipSync ⚡

> Ultra-low latency, cross-device clipboard synchronization powered by Cloudflare Workers (Durable Objects) and Chrome MV3.

English | [中文说明](README_zh.md)

## ✨ Highlights

- **Zero-Latency Feel**: Broadcasts via Cloudflare Durable Objects memory relay directly to your PC.
- **Silent System Paste**: Chrome Extension writes silently to OS clipboard via Offscreen Documents. No tab switching needed—just press `Ctrl+V` (or `Cmd+V`).
- **No-Extension Friendly**: Web client includes a live feed for guest PCs; click once to copy.
- **Cross-Platform Sending**: Send instantly from iOS (Back Tap shortcut), Android (Quick Settings / HTTP Shortcuts), or Web.
- **No Persistence**: Ephemeral in-memory routing; messages are never written to storage.

---

## 🚀 Quick Start

### 1. Deploy Cloudflare Worker (Backend)

```bash
git clone https://github.com/kyohong/clipsync.git
cd clipsync/worker
npx wrangler login
npx wrangler deploy
```

*Take note of your deployed Worker URL: `https://clipsync-relay.<subdomain>.workers.dev`.*

> **Notice for Mainland China**: Due to DNS restrictions on `*.workers.dev`, please bind a **Custom Domain** to the Worker under Cloudflare Dashboard ➔ Settings ➔ Triggers ➔ Custom Domains for stable access.

### 2. Client Setup

#### Primary PC (Chrome Extension)

1. Navigate to `chrome://extensions/` in Chrome.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension/` directory.
4. Click the extension icon, enter your Worker URL and your chosen pairing code (e.g. `0000`).

#### Guest / Unmanaged PC (Web Feed)

Serve `web/index.html` over HTTPS (or `localhost`) and open it, then input your Worker URL and pairing code. Messages will pop up live.

> The Clipboard API only works in a secure context, so opening the file via `file://` will block the one-click copy/read buttons.

#### iOS Quick Setup (Back Tap)

1. Open iOS **Shortcuts** app ➔ Create new shortcut.
2. Add **Get Clipboard** action.
3. Add **Get Contents of URL** action:
   - URL: `https://<your-worker-domain>/send?room=<your_code>`
   - Method: `POST`
   - Request Body: `JSON`, Key `text` ➔ bind to Clipboard.
4. Go to **Settings** ➔ **Accessibility** ➔ **Touch** ➔ **Back Tap** ➔ assign this shortcut to Double Tap.

#### Android Quick Setup

- **Option 1**: Open the Web Client in Chrome and select **Add to Home Screen** for a PWA experience.
- **Option 2**: Use the free open-source app **HTTP Shortcuts**. Create a POST shortcut pointing to your `/send` endpoint, set the payload to `{"text": "{clipboard}"}`, and add it to your Quick Settings notification tiles.

---

## 🔐 Security Notes

- The pairing code is the only access control: anyone who knows (or guesses) the 4-digit code can send to and read from that room. Use a non-obvious code and treat the room as public.
- There is no end-to-end encryption. Text is relayed over TLS and is readable by the relay (Cloudflare) while in flight.
- The relay keeps no message history: sessions live in Durable Object memory and each payload is forwarded once.
- Do not send passwords, API keys, or other secrets.

---

## 📄 License

Released under the [MIT License](LICENSE).
