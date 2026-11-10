# ⚡ ClipSync

> **免安装、零存储的跨端临时剪贴板与对聊中继工具**<br>
> 面向多设备开发者与跨网络协作场景的双向实时剪贴板同步方案。无需安装客户端，不登录聊天账号，数据纯内存转发，断开即清空。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kyohong/clipsync/tree/main/worker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-Web%20%E7%BD%91%E9%A1%B5%E7%AB%AF%20%7C%20Chrome%20%E6%8F%92%E4%BB%B6-orange)](#)
[![Cloudflare](https://img.shields.io/badge/%E5%90%8E%E7%AB%AF-Cloudflare%20Workers%20%2B%20DO-F38020?logo=cloudflare)](https://workers.cloudflare.com/)

[**English Documentation**](README.md) | [**在线 Web 主控台**](https://clipsync-web.pages.dev)

---

## 💡 为什么需要 ClipSync？

现代开发往往横跨多台异构设备：手机负责拍照识别与快速生成，电脑负责执行与调试。把代码片段、日志或临时测试数据从一台设备搬到另一台，依然是一件费时的事：

- **生态割裂与多端协同：** 苹果「通用剪贴板」体验优秀，但在 iPhone + Windows、Mac + Android 等混合办公场景下无法跨系统工作。
- **传统局域网工具的网络局限：** 许多开源局域网传输工具（如 LocalSend）高度依赖设备处于同一局域网并支持 mDNS/广播协议；一旦处于蜂窝网络、访客网络或跨子网环境，设备间便无法相互发现。
- **第三方通讯软件的隐私包袱：** 为了发一段临时代码或测试日志而登录微信/QQ 等社交软件，会留下冗余聊天记录，也需要额外登录个人账号。

**ClipSync 通过轻量、Web 优先的内存中继解决这一问题：打开网页即可收发，数据只在内存管道中流转。**

---

## 💡 核心设计理念与架构优势

- **纯 Web 原生，零系统侵入 (Zero-Install & Zero Footprint)：** 无需安装任何客户端软件，不常驻后台守护进程，不修改系统注册表或网络设置。打开网页即连即用，用完即关。
- **跨网络云端中继 (Cross-Network Cloud Relay)：** 基于 Cloudflare 全球边缘网络中继，不再受限于“必须连接同一 Wi-Fi”的物理网络拓扑。手机使用移动蜂窝网络、电脑连接宽带网络，依然能够毫秒级实时同频。
- **零账号绑定，免认证 (Zero Auth)：** 不收集手机号、邮箱或任何三方账号，通过临时 4 位房间码即开即连。
- **安全断开，数据无痕 (Safe Teardown)：** 支持一键安全断开，断开瞬间立即清空屏幕接收内容并断开数据流，保障屏幕隐私。
- **纯内存中转，零持久化 (Zero Persistence)：** 数据仅在 Cloudflare Durable Objects 运行时内存中以流式管道广播，不落盘、不存库，实现真正的即用即清。

---

## ✨ 核心亮点

- 🔒 **纯内存中转，零持久化：** 基于 Cloudflare Workers 与 **Durable Objects** 架构构建，消息仅通过临时内存管道广播，**不写入数据库、不落盘、不记录消息内容**。
- ⚡ **毫秒级实时推送：** 采用 Server-Sent Events (SSE) 持续流转，手机端点击一键读取发送，电脑端瞬时弹出。
- 🆓 **免费边缘算力，永久免费：** 适配 Cloudflare Workers 免费配额（每天 100,000 次请求），个人与小团队日常使用零费用。
- 📎 **图片、截图与轻量文件：** 支持粘贴截图、拖拽或选择文件（单个 ≤ 8MB），以 DataURL 经你自己的中继转发。
- 🔐 **自带后端（BYOB）：** 中继部署在你自己的 Cloudflare 账号下，不存在共享公共中继，也没有任何第三方后端，流量始终落在你可控的基础设施上。
- 💬 **临时对聊模式：** 房主创建一次性房间，通过 Hash 邀请链接分享；中继按内存 Token 校验，销毁即清空双方界面。
- 🔌 **灵活双端架构：**
  - **免安装 Web 主控台 ([clipsync-web.pages.dev](https://clipsync-web.pages.dev))：** 任意工作机、临时演示设备或手机浏览器打开即用。
  - **Chrome MV3 扩展：** 个人主力机可加载轻量插件，通过 Offscreen Document 自动写入系统剪贴板。

---

## 🧩 双模式说明

- **📋 剪贴板模式：** 原有能力完整保留。任意设备发送文本、截图或轻量文件（≤ 8MB），电脑端实时接收或从记录中复制。
- **💬 临时对聊：** 房主创建一次性房间并分享仅含 Hash 的邀请链接（`#mode=chat&room=…&token=…&relay=…`）。受邀方无需配置：Hash 只在浏览器内解析，写入 `sessionStorage` 后立刻用 `history.replaceState` 从地址栏抹去。中继在 Durable Object 内存中校验会话 Token，不匹配直接返回 `403`。

会话 Token 只存在于 DO 内存与当前标签页的 `sessionStorage`。销毁会话会广播 teardown 事件、关闭所有流，并清空双方的聊天 DOM。

---

## 🚀 3 步搭建专属中继服务（永久免费）

本项目采用「前端托管 + 私有中继」分离设计。你可以直接使用官方 Web 控制台 [clipsync-web.pages.dev](https://clipsync-web.pages.dev)，只需 1 分钟即可部署自己的中继节点：

1. **克隆项目并进入 Worker 目录**

   ```bash
   git clone https://github.com/kyohong/clipsync.git
   cd clipsync/worker
   ```

2. **一键部署到你的 Cloudflare（每天 10 万次免费额度）**

   ```bash
   npx wrangler deploy
   ```

   *首次运行会唤起浏览器授权登录 Cloudflare；部署完成后终端会输出类似 `https://clipsync-relay.<你的前缀>.workers.dev` 的专属链接。*

3. **填入网页控制台**

   打开 [ClipSync Web 控制台](https://clipsync-web.pages.dev)，点击右上角 **⚙️ 设置**，粘贴上述 Worker 链接并保存，随后输入 4 位房间码并点击 **连接信道**。

---

## 🏗️ 架构拓扑

```text
               +--------------------------------------------+
               |             发送端 (例如 iPhone)            |
               |      [ 一键读取剪贴板 / 备用文本框 ]          |
               +---------------------+----------------------+
                                     |
                                HTTP POST /send
                                     v
                 +---------------------------------------+
                 |    Cloudflare Workers + Edge DO       |
                 |      (Durable Object 房间中继)         |
                 |   * 纯内存临时管道流转                   |
                 |   * 零数据库写入 | 断开即清空            |
                 +-------------------+-------------------+
                                     |
                            SSE 实时广播（单向流）
                                     |
               +---------------------+----------------------+
               |                                            |
               v                                            v
+-------------------------------+             +-------------------------------+
|       Chrome MV3 扩展端        |             |         网页主控台 Web        |
|  (后台静默捕获并写入剪贴板)      |             |     (专为公司电脑/临时机打造)     |
|  ==> 电脑按下 Ctrl+V 直接粘贴   |             |  ==> 实时记录流 + 单条一键提取   |
+-------------------------------+             +-------------------------------+
```

每台已连接的电脑保持一条指向自己房间的 SSE 长连接；`POST /send` 把消息写入内存中的各条流后立即返回，中转端不留副本。

---

## 🚀 一键部署私有节点

你可以花 2 分钟将 ClipSync 后端免费一键部署到属于你自己的 Cloudflare 账号（按钮会把 `worker/` 子目录克隆到你的账号并执行 `wrangler deploy`）：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kyohong/clipsync/tree/main/worker)

### 使用 Wrangler CLI 手动部署

```bash
# 1. 克隆代码仓库
git clone https://github.com/kyohong/clipsync.git
cd clipsync/worker

# 2. 登录你的 Cloudflare 账户
npx wrangler login

# 3. 一键部署 Worker 与 Durable Object
npx wrangler deploy
```

部署完成后会得到类似 `https://clipsync-relay.<你的子域>.workers.dev` 的地址。

> **自建网页主控台？** 把 `web/index.html` 顶部的 `DEFAULT_WORKER_URL` 改成你的 Worker 地址，访客就无需手动打开设置；留空则必须手动填写。

---

## 💻 客户端使用方式

### 方式一：Web 网页端（免安装，浏览器打开即用）

1. 在电脑或手机浏览器打开 <https://clipsync-web.pages.dev>。
2. 点击右上角 **⚙️ 设置** 图标，填入自建的 Worker 节点地址（留空则使用部署方默认节点）。
3. 输入任意 4 位 **房间配对码**（如 `0509`），点击 **连接信道**。
4. 手机打开相同链接并按相同配对码连接即可互传（支持链接直达，如 `?room=0509`）。

### 方式二：Chrome 浏览器扩展（主力机自动写入）

1. 在 Chrome 或 Edge 浏览器地址栏访问 `chrome://extensions/`。
2. 打开右上角的 **开发者模式 (Developer mode)**。
3. 点击 **加载已解压的扩展程序 (Load unpacked)**，选择本项目代码中的 `/extension` 目录。
4. 固定插件图标，配置好 Worker 节点与 4 位配对码即可。

---

## 🔐 安全说明

- 4 位配对码是唯一凭证：知道（或猜到）它的人即可收发该房间的内容，请把它当成公开房间，避免使用 `0000` 这类弱码。
- 没有端到端加密：文本经 TLS 传输，中转方 Cloudflare 在链路中可见。
- 不要发送密码、长期有效的 API Key 等敏感凭证。
- 临时对聊的邀请链接把会话 Token 放在 URL Hash 中。请把链接当作密钥：任何持有者都能在房主销毁会话前加入。

---

## 📄 开源许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

---

### ⚖️ 免责声明 (Disclaimer)

ClipSync 是一款轻量级、开源的跨设备即时通讯与剪贴板同步辅助工具，旨在为多设备开发者提供便捷的代码片段与临时测试数据流转支持。

1. 请使用者严格遵守所在组织或机构的网络使用规范与信息安全守则。
2. 严禁使用本工具传输涉及商业机密、敏感个人信息或其他受法律法规保护的数据。
3. 项目作者对使用者因违反合规制度或不当使用所造成的任何直接或间接后果不承担法律责任。
