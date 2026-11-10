# ⚡ ClipSync

> **Zero-Install, Ephemeral Cross-Device Clipboard & Chat Relay**<br>
> Instant bidirectional clipboard sync between mobile and desktop across mixed operating systems. Built for multi-device developer workflows and cross-network collaboration—no installs, no chat apps, and zero persistent storage.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kyohong/clipsync/tree/main/worker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20App%20%7C%20Chrome%20MV3-orange)](#)
[![Cloudflare](https://img.shields.io/badge/Backend-Cloudflare%20Workers%20%2B%20DO-F38020?logo=cloudflare)](https://workers.cloudflare.com/)

[**简体中文文档**](README_zh.md) | [**Live Web Console**](https://clipsync-web.pages.dev)

---

## 💡 Why ClipSync?

Modern development spans heterogeneous devices: a phone for capture and quick AI assistance, a desktop for execution and debugging. Moving snippets, logs, or temporary test payloads between them is still awkward:

- **Ecosystem Fragmentation:** Apple's Universal Clipboard works only between Apple devices; mixed setups such as iPhone + Windows or Mac + Android have no equivalent.
- **Local-Network Topology Limits:** Many open-source transfer tools (e.g., LocalSend) rely on devices sharing the same LAN and on mDNS/broadcast discovery. On cellular networks, guest Wi-Fi, or segmented subnets, devices simply cannot discover each other.
- **Privacy Overhead of Chat Apps:** Using a personal messaging account as a transfer buffer leaves redundant chat history and requires signing in to a personal account just to move a temporary snippet.

**ClipSync addresses this with a lightweight, web-first in-memory relay: open a page, send and receive, and nothing is retained beyond the memory pipeline.**

---

## 💡 Core Design Principles & Architecture

- **Zero Installation & Zero Footprint:** No client software, no background daemon, no registry or network configuration changes. Open a browser tab, connect, and close it when you are done.
- **Cross-Network Cloud Relay (Beyond Local LAN Limitations):** A Cloudflare edge relay removes the "same Wi-Fi" requirement. A phone on cellular and a desktop on broadband stay in sync with sub-second latency.
- **Zero Account Binding & Zero Auth:** No phone number, email, or third-party account is collected. A temporary 4-digit room code is enough to connect.
- **Safe Disconnect & Ephemeral In-Memory Streaming:** One tap disconnects, closes the stream, and clears the on-screen feed to protect what is displayed.
- **Zero Persistence:** Payloads stream only through Durable Object runtime memory—never written to disk or a database.

---

## ✨ Key Highlights

- 🔒 **Zero Persistence (Memory-Only Pipeline):** Built on Cloudflare Workers and **Durable Objects**. Text streams strictly through transient in-memory channels—nothing is persisted to databases or object storage, and payloads are never logged.
- ⚡ **Real-Time Sub-Second Handoff:** Instant streaming via Server-Sent Events (SSE). Hit send on your phone, and it reflects on your PC screen immediately.
- 🆓 **100% Free Edge Compute:** Fully operates within Cloudflare's free tier (100,000 requests/day). Zero infrastructure fees for personal and small-team use.
- 📎 **Images, Screenshots & Light Files:** Paste a screenshot, drop a file, or attach one from the picker (≤ 8MB). Payloads travel as data URLs through your own relay.
- 🔐 **Bring Your Own Backend (BYOB):** The relay runs inside your own Cloudflare account. There is no shared public relay and no third-party backend, so the traffic stays on infrastructure you control.
- 💬 **Ephemeral Chat Mode:** Host a one-off text/image chat with a hash-based invite; the relay validates an in-memory token and wipes both sides on destroy.
- 🔌 **Flexible Dual-Client Model:**
  - **Web Console ([clipsync-web.pages.dev](https://clipsync-web.pages.dev)):** Ideal for temporary terminals, shared desktops, and mobile browsers without setup.
  - **Chrome MV3 Extension:** Seamless background sync directly into the system clipboard on your dedicated development machine.

---

## 🧩 Two Modes

- **📋 Clipboard Mode:** The original relay, fully preserved. Send text, screenshots, or light files (≤ 8MB) from any device; the desktop receives them instantly or copies from the live feed.
- **💬 Ephemeral Chat:** The host creates a one-off room and shares a hash-only invite link (`#mode=chat&room=…&token=…&relay=…`). Guests need no configuration: the hash is parsed in the browser, written to `sessionStorage`, and stripped from the address bar with `history.replaceState` before anything else happens. The relay compares the session token in Durable Object memory and returns `403` on any mismatch.

Session tokens exist only in DO memory and the current tab's `sessionStorage`. Destroying a session broadcasts a teardown event, closes every stream, and wipes the chat DOM on both sides.

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
- Ephemeral-chat invites carry the session token in the URL hash. Treat the link as a secret: anyone holding it can join until the host destroys the session.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

### ⚖️ Disclaimer

ClipSync is a lightweight, open-source utility for cross-device clipboard sharing and the transfer of code snippets or temporary test data between devices.

1. Users must comply with their organization's network usage policies and information security guidelines.
2. Do not use this tool to transmit trade secrets, sensitive personal information, or any data protected by laws and regulations.
3. The project authors assume no liability for any direct or indirect consequences resulting from non-compliant or improper use.
