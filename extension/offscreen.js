const MAX_RETRY_DELAY = 30000;

let config = null;
let source = null;
let sourceUrl = null;
let retryTimer = null;
let retryDelay = 1000;

function eventsUrlFor(workerUrl, roomId) {
  if (!workerUrl || !roomId) return null;
  try {
    const url = new URL(workerUrl.replace(/\/+$/, ''));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/events`;
    url.searchParams.set('room', roomId);
    return url.toString();
  } catch {
    return null;
  }
}

function reportStatus(connected) {
  try {
    chrome.runtime.sendMessage({ type: 'SSE_STATUS', connected }).catch(() => {});
  } catch {
    // 扩展重载后上下文可能已失效
  }
}

function closeSource() {
  if (source) source.close();
  source = null;
  sourceUrl = null;
}

function connect() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (!config) return;

  const url = eventsUrlFor(config.workerUrl, config.roomId);
  if (!url) {
    closeSource();
    reportStatus(false);
    return;
  }

  if (source && sourceUrl === url && source.readyState !== EventSource.CLOSED) return;

  closeSource();
  sourceUrl = url;

  try {
    source = new EventSource(url);
  } catch {
    closeSource();
    scheduleReconnect();
    return;
  }

  source.addEventListener('open', () => {
    retryDelay = 1000;
    reportStatus(true);
  });

  source.addEventListener('message', (event) => {
    handleMessage(event.data);
  });

  source.addEventListener('error', () => {
    reportStatus(false);
    // 连接阶段浏览器会自动重连；CLOSED 表示服务端拒绝（如 404），需手动退避重试
    if (source && source.readyState === EventSource.CLOSED) scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (retryTimer || !config) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
}

function handleMessage(raw) {
  let text;
  try {
    text = JSON.parse(raw)?.text;
  } catch {
    return;
  }
  if (typeof text !== 'string' || !text) return;
  writeToClipboard(text);
}

// 离屏文档没有焦点，navigator.clipboard.writeText 会抛 "Document is not focused"，
// 只能用 textarea + execCommand('copy') 静默写入系统剪贴板。
function writeToClipboard(text) {
  try {
    let box = document.getElementById('clipboard-box');
    if (!box) {
      box = document.createElement('textarea');
      box.id = 'clipboard-box';
      box.style.position = 'absolute';
      box.style.left = '-9999px';
      document.body.appendChild(box);
    }
    box.value = text;
    box.focus();
    box.select();
    const success = document.execCommand('copy');
    if (success) {
      chrome.runtime
        .sendMessage({ type: 'SHOW_NOTIFICATION', text })
        .catch(() => {});
    } else {
      console.error('[ClipSync] execCommand copy failed');
    }
  } catch (err) {
    console.error('[ClipSync] 写入剪贴板异常:', err);
  }
}

function startSse(workerUrl, roomId) {
  config = {
    workerUrl: String(workerUrl ?? '').trim(),
    roomId: String(roomId ?? '').trim(),
  };
  retryDelay = 1000;
  connect();
}

function stopSse() {
  config = null;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  closeSource();
  reportStatus(false);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'INIT_SSE') startSse(message.workerUrl, message.roomId);
  else if (message?.type === 'STOP_SSE') stopSse();
});

// 通知 background 派发当前配置，避免离屏文档晚于配置消息就绪而漏连
try {
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' }).catch(() => {});
} catch {
  // 扩展重载后上下文可能已失效
}
