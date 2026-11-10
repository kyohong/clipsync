# ⚡ ClipSync

> **免安装、零存储的跨端临时剪贴板中继工具**<br>
> 专为企业受限电脑与异构系统（如 iPhone + Windows）打造的双向实时剪贴板同步方案。无须管理员权限，不登聊天账号，数据纯内存转发，断开即清空不留痕。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kyohong/clipsync/tree/main/worker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-Web%20%E7%BD%91%E9%A1%B5%E7%AB%AF%20%7C%20Chrome%20%E6%8F%92%E4%BB%B6-orange)](#)
[![Cloudflare](https://img.shields.io/badge/%E5%90%8E%E7%AB%AF-Cloudflare%20Workers%20%2B%20DO-F38020?logo=cloudflare)](https://workers.cloudflare.com/)

[**English Documentation**](README.md) | [**在线 Web 主控台**](https://clipsync-web.pages.dev)

---

## 💡 为什么需要 ClipSync？

用手机 AI 拍照识别屏幕报错、直接生成优化后的代码，已经是现代开发者的高频操作。但怎么把手机上的代码、命令、临时 API Key 传回电脑，却始终是个极其头疼的问题：

- **生态墙割裂：** 苹果全家桶的“通用剪贴板”体验很好，但如果是 iPhone + Windows 电脑或安卓手机 + Mac，官方生态直接失效。
- **办公电脑权限限制：** 许多局域网快传工具（如 LocalSend、KDE Connect）需要安装客户端，而公司电脑通常没有管理员（Admin）权限；同时企业级 Wi-Fi 普遍开启了“AP 客户端隔离”，设备间根本无法在局域网内广播互联。
- **隐私与合规泄露：** 登录个人微信/QQ 使用“文件传输助手”，不仅把私人聊天记录直接暴露在公司屏幕上，把数据库密码和 API Key 发进通讯软件服务器更有触碰企业合规与安全审计的巨大风险。

**ClipSync 为此而生：纯网页即开即用、内存通道流转、断开即清空。**

---

## 🏢 专为企业办公与受限电脑打造的优势

ClipSync 与传统快传工具的最大区别，在于它**完全不需要依赖理想的家庭局域网与系统安装权限**：

- **零安装、免提权（Zero Install）：** 电脑无需安装任何 `.exe` 软件，只要有现代浏览器，打开 [clipsync-web.pages.dev](https://clipsync-web.pages.dev) 即可使用，绕过 IT 软件安装审批。
- **无视企业内网 AP 隔离：** 借助 Cloudflare 全球边缘节点进行管道中继。手机走 5G 蜂窝网络，电脑连受限企业内网，依然毫秒级穿透互联。
- **零账号、免登录（Zero Auth）：** 不绑定手机号、邮箱或社交账号。输入 4 位配对码（如 `0509`）即刻建立临时房间。
- **安全离场、无痕销毁（Safe Teardown）：** 传输完毕后点击「安全断开」，底层数据监听通道立即切断，并自动清空屏幕上的接收记录，人走桌净。

---

## ✨ 核心亮点

- 🔒 **纯内存中转，零持久化：** 基于 Cloudflare Workers 与 **Durable Objects** 架构构建，消息仅通过临时内存管道广播，**不写入数据库、不落盘、不记录消息内容**。
- ⚡ **毫秒级实时推送：** 采用 Server-Sent Events (SSE) 持续流转，手机端点击一键读取发送，电脑端瞬时弹出。
- 🆓 **白嫖边缘算力，永久免费：** 适配 Cloudflare Workers 免费配额（每天 100,000 次请求），个人与小团队日常使用零费用。
- 📎 **图片、截图与轻量文件：** 支持粘贴截图、拖拽或选择文件（单个 ≤ 8MB），以 DataURL 经你自己的中继转发。
- 🔐 **自带后端（BYOB）：** 中继部署在你自己的 Cloudflare 账号下，不存在共享公共中继，也没有任何第三方后端，流量始终落在你可控的基础设施上。
- 🔌 **灵活双端架构：**
  - **免安装 Web 主控台 ([clipsync-web.pages.dev](https://clipsync-web.pages.dev))：** 任何受限工作机、临时演示设备或手机浏览器打开即用。
  - **Chrome MV3 扩展：** 个人主力机可加载轻量插件，通过 Offscreen Document 自动写入系统剪贴板。

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

### 方式一：Web 网页端（受限电脑首选，免安装）

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

---

## 📄 开源许可证

本项目采用 [MIT 许可证](LICENSE) 开源。
