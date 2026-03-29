// js/flasher/erase.js
// Erase flash functionality using ESPTool.js
// Uses flashBegin (sector-by-sector erase) instead of eraseFlash (chip erase)
// because the sector approach keeps USB responsive on native-USB chips (ESP32-S3).

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
  let transport = null;
  let progressInterval = null;

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
    const port = await navigator.serial.requestPort();

    logToEraseConsole('Connected. Starting erase...', 'info');
    updateEraseProgress(10, 'Connecting to ESP32...');

    const Transport = window.Transport;
    const ESPLoader = window.ESPLoader;

    if (!Transport || !ESPLoader) {
      throw new Error('ESPTool.js classes not available. Please refresh the page.');
    }

    // Create transport — tracing disabled to reduce overhead during long erase
    transport = new Transport(port, false);
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

    // Detect flash size so we erase the right amount
    let flashSizeBytes;
    try {
      const flashSizeKB = await loader.getFlashSize();
      flashSizeBytes = flashSizeKB * 1024;
      const label = flashSizeKB >= 1024
        ? (flashSizeKB / 1024) + ' MB'
        : flashSizeKB + ' KB';
      logToEraseConsole('Detected flash size: ' + label, 'info');
    } catch (e) {
      // Fallback: assume 8 MB (common for ESP32-S3 boards)
      flashSizeBytes = 8 * 1024 * 1024;
      logToEraseConsole('Could not detect flash size, assuming 8 MB', 'warning');
    }

    updateEraseProgress(40, 'Erasing flash...');

    // Show elapsed timer so the user knows the operation is still running
    let elapsed = 0;
    progressInterval = setInterval(() => {
      elapsed++;
      updateEraseProgress(40 + Math.min(elapsed, 50), `Erasing flash... ${elapsed}s`);
    }, 1000);

    if (eraseType === 'all') {
      logToEraseConsole('Erasing entire flash (this can take 30-120 seconds)...', 'warning');

      // Use flashBegin instead of eraseFlash.  flashBegin erases sectors one
      // by one (the same path used during normal firmware upload) which keeps
      // the USB connection alive on native-USB chips like the ESP32-S3.
      // eraseFlash sends a single chip-erase command that can cause a long
      // USB silence which the WebSerial / browser may drop.
      await loader.flashBegin(flashSizeBytes, 0);
    } else {
      logToEraseConsole('Erasing NVS partition (0x9000, size 0x5000)...', 'warning');
      await loader.flashBegin(0x5000, 0x9000);
    }

    clearInterval(progressInterval);
    progressInterval = null;

    updateEraseProgress(92, 'Resetting device...');
    logToEraseConsole('Erase complete (' + elapsed + 's). Resetting device...', 'info');

    // Leave flash download mode
    try {
      await loader.flashFinish(false);
    } catch (e) {
      // Not critical — we will hard-reset next
    }

    // Hard reset the chip so it restarts with clean flash
    try {
      await loader.hardReset();
    } catch (e) {
      logToEraseConsole('Note: Could not hard-reset. Please manually reset your device.', 'warning');
    }

    // Disconnect transport
    try {
      await transport.disconnect();
    } catch (e) {
      // Port may already be closed after hard reset
    }
    transport = null;

    updateEraseProgress(100, 'Erase complete!');
    logToEraseConsole('\u2713 Flash erased successfully! Device has been reset.', 'success');

  } catch (error) {
    if (progressInterval) clearInterval(progressInterval);
    console.error('Erase error:', error);
    logToEraseConsole('\u2717 Error: ' + error.message, 'error');
    updateEraseProgress(0, 'Erase failed');

    // Try to clean up transport on error
    if (transport) {
      try { await transport.disconnect(); } catch (e) { /* ignore */ }
    }
  } finally {
    eraseBtn.disabled = false;
  }
}
