const DEFAULTS = { focus: 25, short: 5, long: 15, autoBreak: false, autoFocus: false };
const labels = { focus: 'YOUR FOCUS SESSION', short: 'A LITTLE BREATHER', long: 'A WELL-DESERVED REST' };
const captions = { focus: 'TIME TO FOCUS', short: 'TAKE A BREATH', long: 'STEP AWAY A WHILE' };
const startLabels = { focus: 'Start focus', short: 'Start break', long: 'Start long break' };
const $ = selector => document.querySelector(selector);
const panel = $('#timer-panel');
const timeDisplay = $('#time-display');
const ring = $('#progress-ring');
const ringLength = 2 * Math.PI * 137;
ring.style.strokeDasharray = ringLength;

function readStored(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}

const storedSettings = readStored('little-pause-settings', {});
let settings = { ...DEFAULTS, ...storedSettings };
let sessions = readStored('little-pause-session-data', { date: new Date().toLocaleDateString(), count: readStored('little-pause-sessions', 0) });
if (sessions.date !== new Date().toLocaleDateString()) sessions = { date: new Date().toLocaleDateString(), count: 0 };
let mode = 'focus';
let remaining = settings.focus * 60;
let running = false;
let deadline = 0;
let interval = null;
let audioContext;
let installPrompt = null;

function saveSessions() { localStorage.setItem('little-pause-session-data', JSON.stringify(sessions)); }
function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
function saveTimer() {
  localStorage.setItem('little-pause-timer', JSON.stringify({ mode, remaining, running, deadline }));
}
function render() {
  timeDisplay.textContent = formatTime(remaining);
  timeDisplay.setAttribute('aria-label', `${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds`);
  ring.style.strokeDashoffset = ringLength * (1 - remaining / (settings[mode] * 60));
  document.title = `${formatTime(remaining)} · ${mode === 'focus' ? 'Focus' : 'Break'} — little pause`;
  $('#mode-kicker').textContent = labels[mode];
  $('#clock-caption').textContent = captions[mode];
  $('#start-label').textContent = running ? 'Pause session' : startLabels[mode];
  $('#start-icon').textContent = running ? 'Ⅱ' : '▶';
  $('#session-count').textContent = sessions.count;
  $('#session-dots').querySelectorAll('i').forEach((dot, index) => dot.classList.toggle('done', index < sessions.count % 4 || (sessions.count > 0 && sessions.count % 4 === 0)));
  panel.dataset.mode = mode;
  document.body.dataset.mode = mode;
  saveTimer();
}
function stopInterval() { if (interval) clearInterval(interval); interval = null; }
function chime() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    [0, .23, .46].forEach((delay, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = [660, 784, 880][index];
      gain.gain.setValueAtTime(.0001, audioContext.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(.13, audioContext.currentTime + delay + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + delay + .42);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + .43);
    });
  } catch { /* The visual timer still completes when audio is unavailable. */ }
}
function notify(title, body) {
  if (Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => registration.showNotification(title, { body, icon: 'icons/icon.svg', badge: 'icons/icon.svg', tag: 'little-pause-session' })).catch(() => {});
  } else new Notification(title, { body, icon: 'icons/icon.svg' });
}
function start() {
  if (running) { pause(); return; }
  if (remaining <= 0) remaining = settings[mode] * 60;
  running = true;
  deadline = Date.now() + remaining * 1000;
  interval = setInterval(tick, 250);
  $('#encouragement').textContent = mode === 'focus' ? 'Stay with this one thing. You’re doing great.' : 'Unclench your shoulders. Breathe easy.';
  render();
}
function pause() {
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  running = false;
  stopInterval();
  render();
}
function setMode(nextMode, autoStart = false) {
  if (!Object.hasOwn(settings, nextMode) || !['focus', 'short', 'long'].includes(nextMode)) return;
  running = false;
  stopInterval();
  mode = nextMode;
  remaining = settings[mode] * 60;
  document.querySelectorAll('.mode-button').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $('#encouragement').textContent = mode === 'focus' ? 'One thing at a time. You’ve got this.' : 'A little breathing room goes a long way.';
  render();
  if (autoStart) start();
}
function completeSession() {
  running = false;
  stopInterval();
  remaining = 0;
  let nextMode = mode === 'focus' ? (sessions.count > 0 && sessions.count % 4 === 3 ? 'long' : 'short') : 'focus';
  if (mode === 'focus') { sessions.count += 1; saveSessions(); }
  const completedMode = mode;
  $('#encouragement').textContent = completedMode === 'focus' ? 'Lovely work. Take a moment to stretch.' : 'All recharged? Ready when you are.';
  chime();
  notify(completedMode === 'focus' ? 'Focus session complete' : 'Break is over', completedMode === 'focus' ? 'You did it. Time for a little pause.' : 'Ready to focus again when you are.');
  const autoStartNext = completedMode === 'focus' ? settings.autoBreak : settings.autoFocus;
  setMode(nextMode, autoStartNext);
  if (!autoStartNext) {
    $('#encouragement').textContent = completedMode === 'focus' ? 'Lovely work. Take a moment to stretch.' : 'All recharged? Ready when you are.';
    render();
  }
}
function tick() {
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  if (remaining <= 0) completeSession();
  else render();
}
function skipSession() {
  const next = mode === 'focus' ? (sessions.count > 0 && sessions.count % 4 === 3 ? 'long' : 'short') : 'focus';
  setMode(next);
}

$('#start-button').addEventListener('click', start);
$('#reset-button').addEventListener('click', () => {
  running = false; stopInterval(); remaining = settings[mode] * 60;
  $('#encouragement').textContent = mode === 'focus' ? 'One thing at a time. You’ve got this.' : 'A little breathing room goes a long way.';
  render();
});
$('#skip-button').addEventListener('click', skipSession);
document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));

const dialog = $('#settings-dialog');
$('#settings-open').addEventListener('click', () => {
  $('#focus-setting').value = settings.focus;
  $('#short-setting').value = settings.short;
  $('#long-setting').value = settings.long;
  $('#auto-break-setting').checked = Boolean(settings.autoBreak);
  $('#auto-focus-setting').checked = Boolean(settings.autoFocus);
  updateNotificationButton();
  dialog.showModal();
});
$('#settings-form').addEventListener('submit', event => {
  if (event.submitter?.id !== 'save-settings') return;
  event.preventDefault();
  const updated = {
    focus: Number($('#focus-setting').value), short: Number($('#short-setting').value), long: Number($('#long-setting').value),
    autoBreak: $('#auto-break-setting').checked, autoFocus: $('#auto-focus-setting').checked
  };
  if (updated.focus < 1 || updated.focus > 90 || updated.short < 1 || updated.short > 30 || updated.long < 1 || updated.long > 60) return;
  settings = updated;
  localStorage.setItem('little-pause-settings', JSON.stringify(settings));
  running = false; stopInterval(); remaining = settings[mode] * 60;
  render(); dialog.close();
});
function updateNotificationButton() {
  const button = $('#notification-button');
  if (!('Notification' in window)) { button.textContent = 'Unavailable'; button.disabled = true; }
  else if (Notification.permission === 'granted') { button.textContent = 'Enabled'; button.disabled = true; }
  else if (Notification.permission === 'denied') { button.textContent = 'Blocked'; button.disabled = true; }
  else { button.textContent = 'Enable'; button.disabled = false; }
}
$('#notification-button').addEventListener('click', async () => {
  if ('Notification' in window) await Notification.requestPermission();
  updateNotificationButton();
});

document.addEventListener('keydown', event => {
  if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName) && !dialog.open) { event.preventDefault(); start(); }
  if (event.key.toLowerCase() === 'r' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !dialog.open) $('#reset-button').click();
});
document.addEventListener('visibilitychange', () => { if (running && !document.hidden) tick(); });

const savedTimer = readStored('little-pause-timer', null);
if (savedTimer && ['focus', 'short', 'long'].includes(savedTimer.mode)) {
  mode = savedTimer.mode;
  remaining = Math.min(settings[mode] * 60, Math.max(0, Number(savedTimer.remaining) || 0));
  if (savedTimer.running && savedTimer.deadline > Date.now()) {
    running = true; deadline = savedTimer.deadline; remaining = Math.ceil((deadline - Date.now()) / 1000); interval = setInterval(tick, 250);
  } else if (savedTimer.running) remaining = 0;
  document.querySelectorAll('.mode-button').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active));
  });
}
render();
if (savedTimer?.running && savedTimer.deadline <= Date.now()) completeSession();

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; $('#install-button').hidden = false;
});
$('#install-button').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('#install-button').hidden = true;
});
window.addEventListener('appinstalled', () => { $('#install-button').hidden = true; });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(error => console.warn('Service worker registration failed:', error)));
}
