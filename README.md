# ⚡ ClipSync

> **Zero-Install, Ephemeral Cross-Device Clipboard Relay**<br>
> Instant bidirectional clipboard sync between mobile and desktop across incompatible ecosystems. Designed for restricted corporate workstations and multi-device setups—no admin permissions, no chat apps, and zero persistent storage.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kyohong/clipsync/tree/main/worker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20App%20%7C%20Chrome%20MV3-orange)](#)
[![Cloudflare](https://img.shields.io/badge/Backend-Cloudflare%20Workers%20%2B%20DO-F38020?logo=cloudflare)](https://workers.cloudflare.com/)

[**简体中文文档**](README_zh.md) | [**Live Web Console**](https://clipsync-web.pages.dev)

---

## 💡 Why ClipSync?

When troubleshooting on a PC, taking a photo of compiler errors with your mobile AI and having it draft a solution is effortless. But getting generated code, sensitive API tokens, or commands back onto your work machine is notoriously broken:

- **Ecosystem Barriers:** Apple Universal Clipboard only works between Apple devices. iPhone + Windows or Android + Mac users are completely locked out.
- **Enterprise Restrictions & Isolation:** Most LAN sync utilities (e.g., LocalSend, KDE Connect) fail on corporate Wi-Fi due to AP/Client Isolation policies, or require admin credentials to install.
- **Privacy & Security Hazards:** Pasting sensitive API keys, cloud credentials, or proprietary snippets into personal chat apps (WeChat Transfer, WhatsApp, Slack) leaves permanent audit logs on third-party servers and risks corporate compliance flags.

**ClipSync resolves this through a lightweight, web-first in-memory relay.**

---

## 🏢 Built for Restricted Workstations

Unlike traditional sync tools that assume an open home network with full system privileges, ClipSync is built from the ground up for locked-down enterprise machines:

- **Zero Install & Zero Admin Rights:** Operates 100% inside any standard browser via [clipsync-web.pages.dev](https://clipsync-web.pages.dev). No `.exe`, no elevated privileges, and no IT approval tickets.
- **Bypasses Network Isolation:** Connects via Cloudflare's global edge network. Your phone can be on 5G while your PC is on an isolated corporate intranet—sync works seamlessly.
- **Zero Personal Footprint:** No accounts, phone numbers, or passwords. Pair devices with a transient 4-digit code (e.g., `0509`).
- **Safe Disconnect & Memory Wipe:** Hit **Disconnect** when done to instantly tear down edge stream listeners and purge on-screen message history, leaving zero trace behind.

---

## ✨ Key Highlights

- 🔒 **Zero Persistence (Memory-Only Pipeline):** Built on Cloudflare Workers and **Durable Objects**. Text streams strictly through transient in-memory channels—nothing is persisted to databases or object storage, and payloads are never logged.
- ⚡ **Real-Time Sub-Second Handoff:** Instant streaming via Server-Sent Events (SSE). Hit send on your phone, and it reflects on your PC screen immediately.
- 🆓 **100% Free Edge Compute:** Fully operates within Cloudflare's free tier (100,000 requests/day). Zero infrastructure fees for personal and small-team use.
- 📎 **Images, Screenshots & Light Files:** Paste a screenshot, drop a file, or attach one from the picker (≤ 8MB). Payloads travel as data URLs through your own relay.
- 🔐 **Bring Your Own Backend (BYOB):** The relay runs inside your own Cloudflare account. There is no shared public relay and no third-party backend, so the traffic stays on infrastructure you control.
- 🔌 **Flexible Dual-Client Model:**
  - **Web Console ([clipsync-web.pages.dev](https://clipsync-web.pages.dev)):** Ideal for guest terminals, corporate PCs, and mobile browsers without setup.
  - **Chrome MV3 Extension:** Seamless background sync directly into the system clipboard on your dedicated development machine.

---

## 🚀 3-Step Self-Hosted Relay (Free Forever)

ClipSync separates the static frontend from the relay. Use the public console at [clipsync-web.pages.dev](https://clipsync-web.pages.dev) and point it at a relay you own — deploying one takes about a minute:

1. **Clone the repo and enter the Worker folder**

   ```bash
   git clone https://github.com/kyohong/clipsync.git
   cd clipsync/worker
   ```

2. **Deploy to your own Cloudflare account (100,000 free requests/day)**

   ```bash
   npx wrangler deploy
   ```

   *The first run opens a browser to authorize Cloudflare. When it finishes, the terminal prints your own relay URL, e.g. `https://clipsync-relay.<your-subdomain>.workers.dev`.*

3. **Point the web console at your relay**

   Open [clipsync-web.pages.dev](https://clipsync-web.pages.dev), click **⚙️ Settings** in the top-right, paste the Worker URL, save, then enter a 4-digit room code and hit **Connect**.

---

## 🏗️ Architecture

```text
               +--------------------------------------------+
               |          Sender (e.g., iPhone)             |
               |   [ Read Clipboard / Manual Input Area ]   |
               +---------------------+----------------------+
                                     |
                                HTTP POST /send
                                     |
                                     v
                 +---------------------------------------+
                 |    Cloudflare Workers + Edge DO       |
                 |      (Durable Object Room Hub)        |
                 |   * Pure In-Memory Broadcast Pipeline |
                 |   * No DB Writes | No Data Retention  |
                 +-------------------+-------------------+
                                     |
                          SSE Broadcast (one-way stream)
                                     |
               +---------------------+----------------------+
               |                                            |
               v                                            v
+-------------------------------+             +-------------------------------+
|     Chrome MV3 Extension      |             |       Web Live Console        |
|  (Offscreen Clipboard Bridge) |             |  (For Corporate / Guest PCs)  |
|  ==> Auto System Clipboard    |             |  ==> Visual Stream + 1-Tap    |
+-------------------------------+             +-------------------------------+
```

Every connected desktop holds one long-lived SSE stream to its room. `POST /send` writes the payload to each stream in memory and returns immediately; the relay keeps no copy.

---

## 🚀 One-Click Deployment

Deploy your own private ClipSync relay backend to Cloudflare in seconds using the **Deploy to Cloudflare** button above (it clones `worker/` into your account and runs `wrangler deploy`), or use the CLI:

```bash
# 1. Clone repository
git clone https://github.com/kyohong/clipsync.git
cd clipsync/worker

# 2. Login to Cloudflare
npx wrangler login

# 3. Deploy Durable Object worker
npx wrangler deploy
```

Take note of your deployed Worker URL: `https://clipsync-relay.<subdomain>.workers.dev`.

> **Hosting your own web console?** Set `DEFAULT_WORKER_URL` at the top of `web/index.html` to your Worker URL so visitors can connect without opening Settings. Leave it empty to require a manual value.

---

## 💻 Client Setup

### 1. Web Console (Zero-Install)

1. Open <https://clipsync-web.pages.dev> on any device.
2. Click the ⚙️ (Settings) icon in the top header to enter your self-hosted Worker URL (or leave it blank to use the deployment's default node).
3. Enter your 4-digit Room Code and click **Connect**.
4. Open the same URL and room on your mobile browser (or share `?room=0509`).

### 2. Chrome MV3 Extension

1. Open `chrome://extensions/` in Chrome or Edge.
2. Toggle on **Developer mode** in the upper-right corner.
3. Click **Load unpacked** and select the `extension/` folder from this repo.
4. Open the extension popup, configure your Worker URL, and pair using your room code.

---

## 🔐 Security Notes

- The pairing code is the only access control. Anyone who knows (or guesses) the 4-digit code can send to and read from that room—treat it as public and pick a non-obvious code.
- There is no end-to-end encryption. Text is relayed over TLS and is readable by the relay (Cloudflare) while in flight.
- Do not send passwords, API keys, or other long-lived secrets.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
