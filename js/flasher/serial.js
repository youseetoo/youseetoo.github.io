// js/flasher/serial.js
// Serial communication for Configure and Hardware Test tabs

import { state } from './config.js';

// =====================================================
// Console Logging Utilities
// =====================================================

export function logToConsole(message, type = 'info') {
  const el = document.getElementById('consoleOutput');
  if (!el) return;
  const line = document.createElement('div');
  line.className = type;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

export function clearConsole() {
  const el = document.getElementById('consoleOutput');
  if (el) el.innerHTML = '<span class="info">Console cleared.</span>';
}

export function logToHwConsole(message, type = 'info') {
  const el = document.getElementById('hwConsoleOutput');
  if (!el) return;
  const line = document.createElement('div');
  line.className = type;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

export function clearHwConsole() {
  const el = document.getElementById('hwConsoleOutput');
  if (el) el.innerHTML = '<span class="info">Console cleared.</span>';
}

// =====================================================
// Configure Tab - Serial Connection
// =====================================================

export async function connectSerial() {
  if (state.isConnected) {
    await disconnectSerial();
    return;
  }

  try {
    const baudRate = parseInt(document.getElementById('baudRate').value);
    state.serialPort = await navigator.serial.requestPort();
    await state.serialPort.open({ baudRate });

    const decoder = new TextDecoderStream();
    state.serialPort.readable.pipeTo(decoder.writable);
    state.serialReader = decoder.readable.getReader();

    const encoder = new TextEncoderStream();
    encoder.readable.pipeTo(state.serialPort.writable);
    state.serialWriter = encoder.writable.getWriter();

    state.isConnected = true;
    updateConnectionStatus(true);
    readSerialLoop();
    logToConsole('Connected to serial port', 'success');
  } catch (error) {
    console.error('Serial connection error:', error);
    logToConsole(`Connection error: ${error.message}`, 'error');
    state.isConnected = false;
    updateConnectionStatus(false);
  }
}

export async function disconnectSerial() {
  try {
    if (state.serialReader) {
      try { await state.serialReader.cancel(); } catch (e) { /* device may be lost */ }
    }
    if (state.serialWriter) {
      try { await state.serialWriter.close(); } catch (e) { /* device may be lost */ }
    }
    if (state.serialPort) {
      try { await state.serialPort.close(); } catch (e) { /* device may be lost */ }
    }
    logToConsole('Disconnected from serial port', 'info');
  } catch (error) {
    console.error('Disconnect error:', error);
  } finally {
    // Always clean up state, even if the device was lost
    state.serialReader = null;
    state.serialWriter = null;
    state.serialPort = null;
    state.isConnected = false;
    updateConnectionStatus(false);
  }
}

async function readSerialLoop() {
  try {
    while (state.isConnected && state.serialReader) {
      const { value, done } = await state.serialReader.read();
      if (done) break;
      if (value) logToConsole(value, 'info');
    }
  } catch (error) {
    if (error.name !== 'NetworkError') {
      console.error('Read error:', error);
      logToConsole(`Read error: ${error.message}`, 'error');
    }
  }
}

export async function sendSerialCommand(command) {
  if (!state.isConnected || !state.serialWriter) {
    logToConsole('Not connected to serial port', 'error');
    return false;
  }
  try {
    await state.serialWriter.write(command + '\n');
    logToConsole(`> ${command}`, 'success');
    return true;
  } catch (error) {
    console.error('Send error:', error);
    logToConsole(`Send error: ${error.message}`, 'error');
    return false;
  }
}

export async function setCanId(address) {
  return await sendSerialCommand(JSON.stringify({ task: '/can_act', address: parseInt(address) }));
}

function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connectionStatus');
  const btn = document.getElementById('connectSerialBtn');
  if (statusEl) {
    statusEl.textContent = connected ? 'Connected' : 'Disconnected';
    statusEl.className = `ms-2 badge ${connected ? 'bg-success' : 'bg-secondary'}`;
  }
  if (btn) {
    btn.innerHTML = connected
      ? '<i class="bi bi-plug-fill"></i> Disconnect'
      : '<i class="bi bi-plug"></i> Connect';
  }
}

// =====================================================
// Hardware Test Tab - Serial Connection
// =====================================================

export async function connectHwSerial() {
  if (state.hwIsConnected) {
    await disconnectHwSerial();
    return;
  }

  try {
    const baudRate = parseInt(document.getElementById('hwBaudRate').value);
    state.hwSerialPort = await navigator.serial.requestPort();
    await state.hwSerialPort.open({ baudRate });

    const decoder = new TextDecoderStream();
    state.hwSerialPort.readable.pipeTo(decoder.writable);
    state.hwSerialReader = decoder.readable.getReader();

    const encoder = new TextEncoderStream();
    encoder.readable.pipeTo(state.hwSerialPort.writable);
    state.hwSerialWriter = encoder.writable.getWriter();

    state.hwIsConnected = true;
    updateHwConnectionStatus(true);
    readHwSerialLoop();
    logToHwConsole('Connected to serial port', 'success');
  } catch (error) {
    console.error('HW serial connection error:', error);
    logToHwConsole(`Connection error: ${error.message}`, 'error');
    state.hwIsConnected = false;
    updateHwConnectionStatus(false);
  }
}

export async function disconnectHwSerial() {
  try {
    if (state.hwSerialReader) {
      try { await state.hwSerialReader.cancel(); } catch (e) { /* device may be lost */ }
    }
    if (state.hwSerialWriter) {
      try { await state.hwSerialWriter.close(); } catch (e) { /* device may be lost */ }
    }
    if (state.hwSerialPort) {
      try { await state.hwSerialPort.close(); } catch (e) { /* device may be lost */ }
    }
    logToHwConsole('Disconnected from serial port', 'info');
  } catch (error) {
    console.error('HW disconnect error:', error);
  } finally {
    // Always clean up state, even if the device was lost
    state.hwSerialReader = null;
    state.hwSerialWriter = null;
    state.hwSerialPort = null;
    state.hwIsConnected = false;
    updateHwConnectionStatus(false);
  }
}

async function readHwSerialLoop() {
  try {
    while (state.hwIsConnected && state.hwSerialReader) {
      const { value, done } = await state.hwSerialReader.read();
      if (done) break;
      if (value) logToHwConsole(value, 'info');
    }
  } catch (error) {
    if (error.name !== 'NetworkError') {
      console.error('HW read error:', error);
      logToHwConsole(`Read error: ${error.message}`, 'error');
    }
  }
}

export async function sendHwSerialCommand(command) {
  if (!state.hwIsConnected || !state.hwSerialWriter) {
    logToHwConsole('Not connected to serial port', 'error');
    return false;
  }
  try {
    await state.hwSerialWriter.write(command + '\n');
    logToHwConsole(`> ${command}`, 'success');
    return true;
  } catch (error) {
    console.error('HW send error:', error);
    logToHwConsole(`Send error: ${error.message}`, 'error');
    return false;
  }
}

function updateHwConnectionStatus(connected) {
  const statusEl = document.getElementById('hwConnectionStatus');
  const btn = document.getElementById('hwConnectSerialBtn');
  if (statusEl) {
    statusEl.textContent = connected ? 'Connected' : 'Disconnected';
    statusEl.className = `ms-2 badge ${connected ? 'bg-success' : 'bg-secondary'}`;
  }
  if (btn) {
    btn.innerHTML = connected
      ? '<i class="bi bi-plug-fill"></i> Disconnect'
      : '<i class="bi bi-plug"></i> Connect';
  }
}
