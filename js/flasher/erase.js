// js/flasher/erase.js
// Erase flash functionality using ESPTool.js

import { state } from './config.js';
import { disconnectSerial, disconnectHwSerial } from './serial.js';

function logToEraseConsole(message, type = 'info') {
  const el = document.getElementById('eraseConsole');
  if (!el) return;
  const line = document.createElement('div');
  line.className = type;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function updateEraseProgress(percent, status) {
  const bar = document.getElementById('eraseProgressBar');
  const statusEl = document.getElementById('eraseStatus');
  if (bar) bar.style.width = `${percent}%`;
  if (statusEl) statusEl.textContent = status;
}

export async function eraseFlash() {
  const eraseType = document.querySelector('input[name="eraseType"]:checked').value;
  const eraseBtn = document.getElementById('eraseFlashBtn');
  const eraseProgress = document.getElementById('eraseProgress');

  try {
    eraseProgress.classList.remove('hidden');
    eraseBtn.disabled = true;
    logToEraseConsole('Requesting serial port...', 'info');

    // Wait for ESPTool to be ready
    try {
      await window.waitForESPTool(5000);
      logToEraseConsole('\u2713 ESPTool.js ready', 'success');
    } catch (err) {
      throw new Error('ESPTool.js failed to load. Please refresh the page and try again.');
    }

    // Close any existing connections first
    if (state.isConnected) {
      logToEraseConsole('\u26A0 Closing existing serial connection...', 'warning');
      try {
        await disconnectSerial();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        logToEraseConsole('Note: Could not close existing connection.', 'warning');
      }
    }
    if (state.hwIsConnected) {
      logToEraseConsole('\u26A0 Closing hardware test connection...', 'warning');
      try {
        await disconnectHwSerial();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        logToEraseConsole('Note: Could not close hardware test connection.', 'warning');
      }
    }

    // Request a new port from the user
    // IMPORTANT: Do NOT call port.open() manually - ESPLoader handles it
    const port = await navigator.serial.requestPort();

    logToEraseConsole('Connected. Starting erase...', 'info');
    updateEraseProgress(10, 'Connecting to ESP32...');

    const Transport = window.Transport;
    const ESPLoader = window.ESPLoader;

    if (!Transport || !ESPLoader) {
      throw new Error('ESPTool.js classes not available. Please refresh the page.');
    }

    // Create transport - pass the unopened port, ESPLoader will open it
    const transport = new Transport(port, true);
    const loader = new ESPLoader({
      transport: transport,
      baudrate: 115200,
      terminal: {
        clean: () => {},
        writeLine: (text) => logToEraseConsole(text, 'info'),
        write: (text) => logToEraseConsole(text, 'info')
      }
    });

    updateEraseProgress(20, 'Syncing...');
    await loader.main();

    updateEraseProgress(40, 'Erasing flash...');
    logToEraseConsole(`Erasing ${eraseType === 'all' ? 'entire flash' : 'NVS partition'}...`, 'warning');

    if (eraseType === 'all') {
      await loader.eraseFlash();
    } else {
      // Erase NVS partition (typically at 0x9000, size 0x5000)
      await loader.eraseRegion(0x9000, 0x5000);
    }

    updateEraseProgress(100, 'Erase complete!');
    logToEraseConsole('\u2713 Flash erased successfully!', 'success');

    // Let transport handle disconnection
    await transport.disconnect();

  } catch (error) {
    console.error('Erase error:', error);
    logToEraseConsole(`\u2717 Error: ${error.message}`, 'error');
    updateEraseProgress(0, 'Erase failed');
  } finally {
    eraseBtn.disabled = false;
  }
}
