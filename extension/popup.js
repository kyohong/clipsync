const $ = (id) => document.getElementById(id);
const t = (key) => chrome.i18n.getMessage(key) || key;

function applyLocale() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.documentElement.lang = chrome.i18n.getUILanguage?.() || 'en';
}

function setStatus(key, kind = '') {
  const el = $('status');
  el.textContent = key ? t(key) : '';
  el.className = kind;
}

async function load() {
  const { workerUrl = '', roomId = '', connected = false } = await chrome.storage.local.get([
    'workerUrl',
    'roomId',
    'connected',
  ]);
  $('workerUrl').value = workerUrl;
  $('roomId').value = roomId;
  if (connected) setStatus('statusConnected', 'ok');
}

$('save').addEventListener('click', async () => {
  const workerUrl = $('workerUrl').value.trim().replace(/\/+$/, '');
  const roomId = $('roomId').value.trim();

  if (!/^https?:\/\/.+/i.test(workerUrl) || !/^\d{4}$/.test(roomId)) {
    setStatus('statusEmptyError', 'error');
    return;
  }

  await chrome.storage.local.set({ workerUrl, roomId, connected: false });
  $('workerUrl').value = workerUrl;
  setStatus('statusSaved');

  try {
    await chrome.runtime.sendMessage({ type: 'CONFIG_UPDATED' });
  } catch {
    // background 唤醒时的竞态：offscreen 也监听 storage 变更，会自行重连
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.connected) return;
  if (changes.connected.newValue === true) {
    setStatus('statusConnected', 'ok');
  } else {
    setStatus('statusDisconnected');
  }
});

applyLocale();
load();
