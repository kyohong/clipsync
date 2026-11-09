# ClipSync ⚡

> 基于 Cloudflare Workers (Durable Objects) 与 Chrome MV3 的极速跨设备剪贴板同步工具。手机复制，电脑直接粘贴。

[English](README.md) | 中文说明

## ✨ 核心特性

- **毫秒级无感同步**：基于 Cloudflare 边缘计算 Durable Objects 内存广播，毫秒级推送。
- **无感静默粘贴**：配合 Chrome 扩展（MV3 Offscreen 提权），电脑无需切窗口，任意软件直接按 `Ctrl+V`（Mac 按 `Cmd+V`）即用。
- **免插件网页端**：临时或受限电脑打开网页即可实时接收并一键复制。
- **全平台支持**：支持 iPhone 轻点背面双击即发、Android 下拉控制中心磁贴一键投送、通用网页端直发。
- **零持久化**：纯内存流转，消息从不落库；房间号隔离通信。

---

## 🚀 极速部署指南

### 1. 部署后端 Worker（免费）

```bash
git clone https://github.com/kyohong/clipsync.git
cd clipsync/worker
npx wrangler login
npx wrangler deploy
```

*部署完成后，将获得专属 Worker 地址：`https://clipsync-relay.<你的前缀>.workers.dev`。*

> **中国大陆用户特别提示**：由于默认 `*.workers.dev` 域名在大陆地区受限，建议在 Cloudflare 仪表盘中的 **Worker 设置 ➔ 触发器 ➔ 自定义域 (Custom Domains)** 绑定一个自己的域名，即可获得稳定快速的体验。

### 2. 客户端配置

#### 主力电脑（安装 Chrome 扩展）

1. 在 Chrome 浏览器打开 `chrome://extensions/`。
2. 开启右上角 **“开发者模式”**。
3. 点击 **“加载已解压的扩展程序”**，选中项目中的 `extension/` 文件夹。
4. 点击插件图标，填入你的 Worker 地址和自定义配对码（例如 `0000`）。

#### 临时电脑（纯网页免安装）

通过 HTTPS（或 `localhost`）访问部署好的网页（如 Cloudflare Pages），填入相同配对码，来信实时跳出，点击即可一键复制。

> 剪贴板 API 仅在安全上下文中可用，用 `file://` 直接打开 `web/index.html` 会导致“一键复制/读取”按钮失效。

#### iPhone 手机端配置（轻点背面即发）

1. 打开 iOS「快捷指令」App，新建快捷指令。
2. 添加「获取剪贴板」操作。
3. 添加「获取 URL 的内容」操作：
   - URL: `https://你的Worker域名/send?room=配对码`
   - 方法: `POST`
   - 请求体: `JSON`，添加字段 `text` 绑定到剪贴板。
4. 进入 iPhone「设置」➔「辅助功能」➔「触控」➔「轻点背面」➔「轻点两下」，选择该快捷指令。

#### Android 安卓端配置

- **极简模式**：手机浏览器打开网页端，点击菜单选择 **“添加到主屏幕”** 获得 App 级体验。
- **快捷磁贴模式**：使用开源免费工具 **HTTP Shortcuts**，新建 POST 请求指向 `/send` 接口，内容填 `{"text": "{clipboard}"}`，可将其放置在顶部下拉通知栏磁贴，长按复制后下拉一点即发。

---

## 🔐 安全说明

- 配对码就是唯一的访问控制：知道（或猜到）4 位配对码的人，都能向该房间发送内容、也能读到该房间的推送。请使用不常见的配对码，并把房间当成公开的。
- 没有端到端加密。文本经 TLS 传输，中转方（Cloudflare）在链路中可见。
- 中转不存历史：连接保存在 Durable Object 内存中，每条消息只转发一次。
- 不要发送密码、API Key 等敏感信息。

---

## 📄 开源许可

本项目遵循 [MIT License](LICENSE) 许可协议。
