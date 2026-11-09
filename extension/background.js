const OFFSCREEN_URL = 'offscreen.html';
const ALARM_NAME = 'keepAliveAlarm';
const ICON_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAoklEQVR42u3aywmAMBAFwDRjZZZvEdqAFzX7icyDXAMO7IuHHUPkU7b9OCsPAAAAAAAAAAAAgNUA7gIAwM8BniQdIKOwIgCmlSeAwo+tQAEAAMBcgIoAAAAAAAAAAPoDdLw3DSDyrxKAEVCCAAAAUIKeQQBGQAkCAABACXoGSxYrqgHabIhUjcASAJEl2HZHKKv1AQAAYFcYAAAAAAAAEHmTCwkJGyv9y8ZIAAAAAElFTkSuQmCC';

const t = (key) => chrome.i18n.getMessage(key);

async function ensureOffscreen() {
  try {
    if (await chrome.offscreen.hasDocument()) return;
  } catch {
    // hasDocument 在旧版本可能不可用，继续尝试创建
  }
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ['CLIPBOARD'],
      justification:
        'Receives clipboard text over SSE and writes it silently to the system clipboard.',
    });
  } catch {
    // 并发创建时文档可能已存在，忽略
  }
}

async function ensureKeepAlive() {
  if (!(await chrome.alarms.get(ALARM_NAME))) {
    await chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
  }
}

async function readConfig() {
  const { workerUrl = '', roomId = '' } = await chrome.storage.local.get(['workerUrl', 'roomId']);
  return {
    workerUrl: String(workerUrl).trim(),
    roomId: String(roomId).trim(),
  };
}

async function sendToOffscreen(message) {
  await ensureOffscreen();
  try {
    await chrome.runtime.sendMessage(message);
  } catch {
    // 离屏文档尚未注册监听时会失败，OFFSCREEN_READY 会触发补发
  }
}

async function dispatchConfig() {
  const { workerUrl, roomId } = await readConfig();

  if (!workerUrl || !roomId) {
    await sendToOffscreen({ type: 'STOP_SSE' });
    await chrome.storage.local.set({ connected: false }).catch(() => {});
    return;
  }

  await sendToOffscreen({ type: 'INIT_SSE', workerUrl, roomId });
}

function bootstrap() {
  ensureKeepAlive().catch(() => {});
  dispatchConfig().catch(() => {});
}

chrome.runtime.onInstalled.addListener(bootstrap);
chrome.runtime.onStartup.addListener(bootstrap);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) ensureOffscreen();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.workerUrl || changes.roomId)) {
    dispatchConfig().catch(() => {});
  }
});

// MV3 的离屏文档不适合直接调 notifications，统一由 background 弹出。
function showNotification(text, ok) {
  const preview = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  const title = t(ok ? 'notifTitle' : 'notifFailedTitle');
  const body = ok ? `${t('notifPrefix')}${preview}` : t('notifFailedPrefix');

  chrome.notifications.create(
    `clipsync-${Date.now()}`,
    {
      type: 'basic',
      iconUrl: ICON_URL,
      title,
      message: body.slice(0, 300),
      priority: 0,
    },
    () => void chrome.runtime.lastError
  );
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return;

  if (message.type === 'SHOW_NOTIFICATION') {
    showNotification(message.text, message.ok !== false);
    return;
  }

  if (message.type === 'SSE_STATUS') {
    chrome.storage.local.set({ connected: message.connected === true }).catch(() => {});
    return;
  }

  if (message.type === 'OFFSCREEN_READY') {
    dispatchConfig().catch(() => {});
    return;
  }

  if (message.type === 'CONFIG_UPDATED') {
    dispatchConfig()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
});

// Service Worker 冷启动时也要把当前配置推给离屏文档。
dispatchConfig().catch(() => {});
