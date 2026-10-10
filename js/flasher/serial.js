// js/flasher/serial.js
// One shared WebSerial connection for the Test and Configure tabs.
// Replies from the firmware are framed as "++\n<json>\n--\n\0"; everything else is log output.

const listeners = new Set();
let port = null, reader = null, writer = null, readLoop = null;
let showLogs = true;

// ── Frame parser (pure, unit-tested in tests/frame-parser.test.mjs) ──────
export function createFrameParser(onFrame, onLog) {
  let buf = '', inFrame = false, frame = '';
  return (chunk) => {
    buf += chunk.replace(/\0/g, '');
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '');
      buf = buf.slice(nl + 1);
      const t = line.trim();
      if (t === '++') { inFrame = true; frame = ''; continue; }
      if (t === '--' && inFrame) {
        inFrame = false;
        let obj = null;
        try { obj = JSON.parse(frame); } catch { /* keep raw */ }
        onFrame(obj, frame);
        continue;
      }
      if (inFrame) frame += t;
      else if (t) onLog(t);
    }
  };
}

// ── Console ──────────────────────────────────────────────────────────────
export function log(text, type = 'info') {
  const el = document.getElementById('consoleOutput');
  if (!el) return;
  if (type === 'log' && !showLogs) return;
  const line = document.createElement('div');
  line.className = type;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  el.appendChild(line);
  while (el.childElementCount > 800) el.firstElementChild.remove();
  el.scrollTop = el.scrollHeight;
}
export function clearConsole() {
  const el = document.getElementById('consoleOutput');
  if (el) el.innerHTML = '';
}
export function setShowLogs(v) { showLogs = v; }

// ── Connection ───────────────────────────────────────────────────────────
export const isConnected = () => !!writer;
export function onFrame(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function connect(baudRate) {
  if (!('serial' in navigator)) throw new Error('WebSerial not supported – use Chrome, Edge or Opera');
  port = await navigator.serial.requestPort();
  await port.open({ baudRate, bufferSize: 8192 });
  const decoder = new TextDecoderStream();
  port.readable.pipeTo(decoder.writable).catch(() => {});
  reader = decoder.readable.getReader();
  const encoder = new TextEncoderStream();
  encoder.readable.pipeTo(port.writable).catch(() => {});
  writer = encoder.writable.getWriter();

  const parse = createFrameParser(
    (obj, raw) => {
      log(raw, obj ? 'success' : 'warning');
      if (obj) listeners.forEach((fn) => { try { fn(obj); } catch (e) { console.error(e); } });
    },
    (line) => log(line, 'log'),
  );
  readLoop = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) parse(value);
      }
    } catch (e) {
      if (e.name !== 'NetworkError') log(`Read error: ${e.message}`, 'error');
    }
  })();
  updateStatus();
  log(`Connected at ${baudRate} baud. Opening the port usually resets the board – wait ~2 s.`, 'info');
}

export async function disconnect() {
  try { await reader?.cancel(); } catch { /* device gone */ }
  try { await writer?.close(); } catch { /* device gone */ }
  try { await readLoop; } catch { /* ignore */ }
  try { await port?.close(); } catch { /* device gone */ }
  port = reader = writer = readLoop = null;
  updateStatus();
  log('Disconnected', 'info');
}

export async function send(cmd) {
  const line = typeof cmd === 'string' ? cmd.trim() : JSON.stringify(cmd);
  if (!writer) { log('Not connected – click "Connect" first', 'error'); return false; }
  if (line.startsWith('{')) {
    try { JSON.parse(line); } catch (e) { log(`Invalid JSON: ${e.message}`, 'error'); return false; }
  }
  await writer.write(line + '\n');
  log(`> ${line}`, 'sent');
  return true;
}

export function updateStatus() {
  const on = isConnected();
  document.querySelectorAll('[data-conn-status]').forEach((el) => {
    el.textContent = on ? 'Connected' : 'Disconnected';
    el.className = `badge ${on ? 'bg-success' : 'bg-secondary'}`;
  });
  document.querySelectorAll('[data-conn-btn]').forEach((el) => {
    el.innerHTML = on ? '<i class="bi bi-plug-fill"></i> Disconnect' : '<i class="bi bi-plug"></i> Connect';
  });
  document.querySelectorAll('[data-needs-conn]').forEach((el) => { el.disabled = !on; });
}
