// js/flasher/app.js
// Main entry point for UC2 Firmware Flasher

import {
  GITHUB_API, IMSWITCH_API, RAW_BASE, IMSWITCH_REPO,
  BOARD_CONFIG, state
} from './config.js';

import {
  connectSerial, disconnectSerial, sendSerialCommand, setCanId,
  connectHwSerial, disconnectHwSerial, sendHwSerialCommand,
  logToConsole, clearConsole, logToHwConsole, clearHwConsole
} from './serial.js';

import { eraseFlash } from './erase.js';
import { initHardwareTest } from './hwtest.js';

// =====================================================
// Loading Overlay
// =====================================================

function showLoading(text = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const textEl = document.getElementById('loadingText');
  if (textEl) textEl.textContent = text;
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('hidden');
}

// =====================================================
// URL Parameter Parsing
// =====================================================

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('firmware')) {
    state.selectedBoard = params.get('firmware');
  }
  if (params.has('release')) {
    state.currentRelease = params.get('release');
  }
  if (params.has('tab')) {
    const tab = params.get('tab');
    const tabBtn = document.getElementById(`${tab}-tab`);
    if (tabBtn) {
      new bootstrap.Tab(tabBtn).show();
    }
  }
  if (params.has('canid')) {
    const canIdInput = document.getElementById('customCanId');
    if (canIdInput) canIdInput.value = params.get('canid');
  }
}

// =====================================================
// GitHub Release Loading
// =====================================================

async function loadReleases() {
  try {
    showLoading('Loading firmware releases...');

    // Load firmware releases
    const fwResponse = await fetch(`${GITHUB_API}/releases`);
    if (!fwResponse.ok) throw new Error('Failed to fetch firmware releases');

    const releases = await fwResponse.json();
    state.releases = releases;

    // Load ImSwitch releases
    try {
      const imswitchResponse = await fetch(`${IMSWITCH_API}/releases`);
      if (imswitchResponse.ok) {
        state.imswitchReleases = await imswitchResponse.json();
        console.log(`Loaded ${state.imswitchReleases.length} ImSwitch OS releases`);
      }
    } catch (err) {
      console.warn('Failed to load ImSwitch releases:', err);
    }

    // Populate firmware release dropdown
    const releaseSelect = document.getElementById('releaseSelect');
    releaseSelect.innerHTML = '';

    const latestOpt = document.createElement('option');
    latestOpt.value = 'latest';
    latestOpt.textContent = 'Latest Stable';
    releaseSelect.appendChild(latestOpt);

    releases.forEach(release => {
      const opt = document.createElement('option');
      opt.value = release.tag_name;
      opt.textContent = `${release.tag_name} ${release.prerelease ? '(beta)' : ''}`;
      releaseSelect.appendChild(opt);
    });

    // Populate ImSwitch OS release dropdown
    const imswitchSelect = document.getElementById('imswitchReleaseSelect');
    if (state.imswitchReleases && state.imswitchReleases.length > 0) {
      imswitchSelect.innerHTML = '<option value="">-- Select ImSwitch OS Release --</option>';
      state.imswitchReleases.slice(0, 20).forEach(release => {
        const opt = document.createElement('option');
        opt.value = release.tag_name;
        opt.textContent = `${release.tag_name} ${release.prerelease ? '(beta)' : ''}`;
        imswitchSelect.appendChild(opt);
      });
    }

    // Select from URL or default
    if (state.currentRelease) {
      releaseSelect.value = state.currentRelease;
    }

    updateVersionDisplay();
    logToConsole('\u2713 Firmware will be loaded from GitHub raw URLs', 'success');

  } catch (error) {
    console.error('Error loading releases:', error);
    logToConsole(`Error loading releases: ${error.message}`, 'error');
    document.getElementById('releaseSelect').innerHTML = '<option value="static">Local (static)</option>';
  } finally {
    hideLoading();
  }
}

function updateVersionDisplay() {
  const selectedValue = document.getElementById('releaseSelect').value;
  const currentVersionEl = document.getElementById('currentVersion');
  const releaseDateEl = document.getElementById('releaseDate');
  let release;

  if (selectedValue === 'latest' || selectedValue === 'static') {
    release = state.releases[0];
  } else {
    release = state.releases.find(r => r.tag_name === selectedValue);
  }

  if (release) {
    currentVersionEl.textContent = release.tag_name;
    currentVersionEl.className = `badge version-badge ${release.prerelease ? 'bg-warning' : 'bg-success'}`;
    releaseDateEl.textContent = new Date(release.published_at).toLocaleDateString();
    state.currentRelease = release.tag_name;
  } else {
    currentVersionEl.textContent = 'Static';
    currentVersionEl.className = 'badge version-badge bg-secondary';
    releaseDateEl.textContent = '';
  }

  if (state.selectedBoard) {
    updateManifestUrl();
  }
}

// =====================================================
// ImSwitch Firmware Resolution
// =====================================================

async function resolveFirmwareFromImSwitch(imswitchTag) {
  const fileUrl = `https://raw.githubusercontent.com/${IMSWITCH_REPO}/refs/tags/${imswitchTag}/deployments/firmware.pkg/deployment.compose.yml`;
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch deployment file: ${response.statusText}`);
  }

  const yamlContent = await response.text();
  const imageMatch = yamlContent.match(/image:\s+ghcr\.io\/youseetoo\/firmware-image-server:(\S+?)(?:@|\s|$)/);

  if (!imageMatch) {
    throw new Error('Could not find firmware-image-server image in deployment file');
  }

  let tag = imageMatch[1];
  console.log('Found Docker image tag:', tag);

  if (tag.startsWith('sha-')) {
    const imswitchRelease = state.imswitchReleases.find(r => r.tag_name === imswitchTag);
    if (imswitchRelease) {
      const imswitchDate = new Date(imswitchRelease.published_at);
      const closestFirmware = state.releases
        .filter(r => !r.prerelease)
        .map(r => ({ ...r, dateDiff: Math.abs(new Date(r.published_at) - imswitchDate) }))
        .sort((a, b) => a.dateDiff - b.dateDiff)[0];

      if (closestFirmware) {
        logToConsole(`\u2139 Matched to firmware release by date: ${closestFirmware.tag_name}`, 'info');
        return closestFirmware.tag_name;
      }
    }
    return null;
  } else if (tag.match(/^v\d{4}\.\d{2}\.\d{2}/)) {
    return tag;
  }

  return null;
}

// =====================================================
// Board Rendering
// =====================================================

function renderBoards(filter = '', category = 'all') {
  const boardGrid = document.getElementById('boardGrid');
  boardGrid.innerHTML = '';

  const filterLower = filter.toLowerCase();

  Object.entries(BOARD_CONFIG).forEach(([boardId, config]) => {
    if (category !== 'all' && config.category !== category) return;
    if (filter && !config.name.toLowerCase().includes(filterLower) &&
        !boardId.toLowerCase().includes(filterLower)) return;

    const col = document.createElement('div');
    col.className = 'col';
    const isSelected = state.selectedBoard === boardId;

    const categoryColors = {
      'frame': 'primary', 'electrobox': 'warning',
      'qbox': 'success', 'standalone': 'secondary'
    };
    const categoryBadge = config.category
      ? `<span class="badge bg-${categoryColors[config.category] || 'secondary'} ms-1" style="font-size: 0.6rem;">${config.category.toUpperCase()}</span>`
      : '';

    col.innerHTML = `
      <div class="card board-card h-100 ${isSelected ? 'selected' : ''}" data-board="${boardId}">
        <div class="card-body text-center p-2">
          <img src="${config.image}" alt="${config.name}" class="board-img mb-2"
               onerror="this.src='./IMAGES/placeholder.svg'">
          <h6 class="card-title mb-1" style="font-size: 0.85rem;">${config.name}</h6>
          <div>
            <span class="badge bg-secondary" style="font-size: 0.7rem;">${config.chip}</span>
            ${config.canConfig ? '<span class="badge bg-info ms-1" style="font-size: 0.7rem;">CAN</span>' : ''}
            ${categoryBadge}
          </div>
        </div>
      </div>
    `;

    col.querySelector('.board-card').addEventListener('click', () => selectBoard(boardId));
    boardGrid.appendChild(col);
  });

  // If a board was preselected from URL, select it
  if (state.selectedBoard && !filter) {
    selectBoard(state.selectedBoard);
  }
}

function selectBoard(boardId) {
  state.selectedBoard = boardId;
  const config = BOARD_CONFIG[boardId];

  document.querySelectorAll('.board-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.board === boardId);
  });

  const nameEl = document.getElementById('selectedBoardName');
  const chipEl = document.getElementById('selectedBoardChip');
  if (nameEl) nameEl.textContent = config ? config.name : boardId;
  if (chipEl) chipEl.textContent = config ? config.chip : '';

  const activateBtn = document.getElementById('installButton')?.querySelector('button[slot="activate"]');
  if (activateBtn) activateBtn.disabled = false;

  updateManifestUrl();
  if (config) showBoardInfo(boardId, config);
  updateDirectLink();
}

function showBoardInfo(boardId, config) {
  const card = document.getElementById('boardInfoCard');
  const info = document.getElementById('boardInfo');
  card.classList.remove('hidden');

  let canConfigHtml = '';
  if (config.canConfig) {
    canConfigHtml = `
      <div class="mt-3">
        <h6><i class="bi bi-diagram-3"></i> CAN Configuration</h6>
        <p class="text-muted small">This board supports CAN bus. Configure after flashing in the "Configure" tab.</p>
        ${config.defaultCanId ? `<p>Default CAN ID: <strong>${config.defaultCanId}</strong></p>` : ''}
      </div>
    `;
  }

  info.innerHTML = `
    <div class="row">
      <div class="col-md-4 text-center">
        <img src="${config.image}" alt="${config.name}" style="max-width: 150px;"
             onerror="this.src='./IMAGES/placeholder.svg'">
      </div>
      <div class="col-md-8">
        <h5>${config.name}</h5>
        <p class="text-muted">${config.description}</p>
        <p><strong>Chip:</strong> ${config.chip}</p>
        ${canConfigHtml}
      </div>
    </div>
  `;
}

// =====================================================
// Manifest URL & Firmware Availability
// =====================================================

async function updateManifestUrl() {
  if (!state.selectedBoard) return;

  const boardConfig = BOARD_CONFIG[state.selectedBoard];
  let manifestUrl;
  let releaseTag = state.currentRelease;

  // Handle ImSwitch release selection
  if (releaseTag && releaseTag.startsWith('imswitch:')) {
    const imswitchTag = releaseTag.replace('imswitch:', '');
    logToConsole(`\u231B Resolving firmware version for ImSwitch ${imswitchTag}...`, 'info');
    try {
      const fwVersion = await resolveFirmwareFromImSwitch(imswitchTag);
      if (fwVersion) {
        releaseTag = fwVersion;
        logToConsole(`\u2713 Resolved to firmware version: ${fwVersion}`, 'success');
      } else {
        logToConsole('\u26A0 Could not resolve firmware version, using latest', 'warning');
        releaseTag = 'latest';
      }
    } catch (err) {
      console.error('Error resolving ImSwitch firmware:', err);
      logToConsole(`\u2717 Error resolving firmware: ${err.message}`, 'error');
      releaseTag = 'latest';
    }
  }

  // Handle 'latest' release selection
  if (releaseTag === 'latest') {
    const latestRelease = state.releases.find(r => !r.prerelease);
    releaseTag = latestRelease ? latestRelease.tag_name : state.releases[0]?.tag_name;
  }

  // Build manifest URL
  if (boardConfig && boardConfig.manifestPath) {
    manifestUrl = `${window.location.origin}${boardConfig.manifestPath}${state.selectedBoard}-manifest.json`;
  } else if (releaseTag) {
    manifestUrl = `${RAW_BASE}/${releaseTag}/${state.selectedBoard}-manifest.json`;
    logToConsole(`\u2713 Loading from GitHub: ${releaseTag}/${state.selectedBoard}`, 'success');
  } else {
    manifestUrl = `./static/firmware_build/${state.selectedBoard}-manifest.json`;
  }

  const installButton = document.getElementById('installButton');
  installButton.manifest = manifestUrl;
  console.log('Final manifest URL:', manifestUrl);

  // Check if the manifest actually exists before showing the install button
  await checkManifestAvailability(manifestUrl);
}

async function checkManifestAvailability(url) {
  const activateBtn = document.getElementById('installButton')?.querySelector('button[slot="activate"]');
  const warningEl = document.getElementById('firmwareWarning');

  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      // Firmware manifest is available
      if (activateBtn && state.selectedBoard) activateBtn.disabled = false;
      if (warningEl) warningEl.classList.add('hidden');
    } else {
      // Firmware manifest not found (404)
      if (activateBtn) activateBtn.disabled = true;
      if (warningEl) warningEl.classList.remove('hidden');
      logToConsole(`\u26A0 Firmware not available for ${state.selectedBoard} in this version`, 'warning');
    }
  } catch (err) {
    // Network error - still allow the attempt but warn
    console.warn('Could not verify firmware availability:', err);
  }
}

// =====================================================
// Direct Link
// =====================================================

function updateDirectLink() {
  const params = new URLSearchParams();
  if (state.selectedBoard) params.set('firmware', state.selectedBoard);
  if (state.currentRelease && state.currentRelease !== 'latest') {
    params.set('release', state.currentRelease);
  }

  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  const directLink = document.getElementById('directLink');
  if (directLink) directLink.value = url;
}

// =====================================================
// Event Listeners
// =====================================================

function setupEventListeners() {
  const releaseSelect = document.getElementById('releaseSelect');
  const imswitchSelect = document.getElementById('imswitchReleaseSelect');
  const imswitchLink = document.getElementById('imswitchReleaseLink');

  // Release selection
  releaseSelect.addEventListener('change', () => {
    imswitchSelect.value = '';
    imswitchLink.classList.add('hidden');
    updateVersionDisplay();
  });

  // ImSwitch release selection
  imswitchSelect.addEventListener('change', async () => {
    const selectedImswitch = imswitchSelect.value;
    if (selectedImswitch) {
      state.currentRelease = `imswitch:${selectedImswitch}`;
      logToConsole(`\u231B Resolving firmware for ImSwitch ${selectedImswitch}...`, 'info');

      const imswitchRelease = state.imswitchReleases.find(r => r.tag_name === selectedImswitch);
      if (imswitchRelease) {
        const linkElem = imswitchLink.querySelector('a');
        linkElem.href = imswitchRelease.html_url;
        linkElem.innerHTML = `<i class="bi bi-download"></i> Download ImSwitch OS ${selectedImswitch}`;
        imswitchLink.classList.remove('hidden');
      }

      try {
        const fwVersion = await resolveFirmwareFromImSwitch(selectedImswitch);
        if (fwVersion) {
          releaseSelect.value = fwVersion;
          state.currentRelease = fwVersion;
          logToConsole(`\u2713 Resolved to firmware ${fwVersion}`, 'success');
        } else {
          logToConsole('\u26A0 Could not resolve firmware version', 'warning');
          releaseSelect.value = 'latest';
          state.currentRelease = 'latest';
        }
      } catch (err) {
        console.error('Error resolving:', err);
        logToConsole(`\u2717 Error: ${err.message}`, 'error');
        releaseSelect.value = 'latest';
        state.currentRelease = 'latest';
      }

      updateVersionDisplay();
    } else {
      imswitchLink.classList.add('hidden');
    }
  });

  // Board category filter
  document.getElementById('boardCategory').addEventListener('change', (e) => {
    state.currentCategory = e.target.value;
    renderBoards(document.getElementById('boardSearch').value, state.currentCategory);
  });

  // Board search
  document.getElementById('boardSearch').addEventListener('input', (e) => {
    renderBoards(e.target.value, state.currentCategory);
  });

  // Copy link
  document.getElementById('copyLinkBtn').addEventListener('click', () => {
    const directLink = document.getElementById('directLink');
    directLink.select();
    navigator.clipboard.writeText(directLink.value);
    const btn = document.getElementById('copyLinkBtn');
    btn.innerHTML = '<i class="bi bi-check"></i>';
    setTimeout(() => { btn.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 2000);
  });

  // Configure tab - Serial connection
  document.getElementById('connectSerialBtn').addEventListener('click', connectSerial);
  document.getElementById('clearConsoleBtn').addEventListener('click', clearConsole);

  document.getElementById('sendCommandBtn').addEventListener('click', () => {
    const input = document.getElementById('customCommand');
    const cmd = input.value.trim();
    if (cmd) { sendSerialCommand(cmd); input.value = ''; }
  });

  document.getElementById('customCommand').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('sendCommandBtn').click();
  });

  // CAN presets (Configure tab)
  document.querySelectorAll('.can-preset').forEach(preset => {
    preset.addEventListener('click', () => {
      document.querySelectorAll('.can-preset').forEach(p => p.classList.remove('selected'));
      preset.classList.add('selected');
      setCanId(preset.dataset.address);
    });
  });

  document.getElementById('setCustomCanBtn').addEventListener('click', () => {
    const id = document.getElementById('customCanId').value;
    if (id) setCanId(id);
  });

  // Quick commands (Configure tab)
  document.querySelectorAll('.quick-cmd').forEach(btn => {
    btn.addEventListener('click', () => sendSerialCommand(btn.dataset.cmd));
  });

  // Erase flash
  document.getElementById('eraseFlashBtn').addEventListener('click', eraseFlash);

  // Hardware test tab - Serial
  document.getElementById('hwConnectSerialBtn').addEventListener('click', () => {
    connectHwSerial();
  });
  document.getElementById('hwClearConsoleBtn').addEventListener('click', clearHwConsole);

  document.getElementById('hwSendCommandBtn').addEventListener('click', () => {
    const input = document.getElementById('hwCustomCommand');
    const cmd = input.value.trim();
    if (cmd) { sendHwSerialCommand(cmd); input.value = ''; }
  });

  document.getElementById('hwCustomCommand').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('hwSendCommandBtn').click();
  });

  // Hardware test quick commands
  document.querySelectorAll('.hw-quick-cmd').forEach(btn => {
    btn.addEventListener('click', () => sendHwSerialCommand(btn.dataset.cmd));
  });

  // Hardware test - Motor controls (existing parametric controls)
  document.getElementById('motorMovePositive')?.addEventListener('click', () => {
    const cmd = {
      task: '/motor_act',
      motor: {
        steppers: [{
          stepperid: parseInt(document.getElementById('motorStepperId').value),
          position: parseInt(document.getElementById('motorPosition').value),
          speed: parseInt(document.getElementById('motorSpeed').value),
          isabs: 0, isaccel: 1,
          accel: parseInt(document.getElementById('motorAccel').value),
          qid: 1
        }]
      }
    };
    sendHwSerialCommand(JSON.stringify(cmd));
  });

  document.getElementById('motorMoveNegative')?.addEventListener('click', () => {
    const cmd = {
      task: '/motor_act',
      motor: {
        steppers: [{
          stepperid: parseInt(document.getElementById('motorStepperId').value),
          position: -parseInt(document.getElementById('motorPosition').value),
          speed: parseInt(document.getElementById('motorSpeed').value),
          isabs: 0, isaccel: 1,
          accel: parseInt(document.getElementById('motorAccel').value),
          qid: 1
        }]
      }
    };
    sendHwSerialCommand(JSON.stringify(cmd));
  });

  document.getElementById('motorStop')?.addEventListener('click', () => {
    const cmd = {
      task: '/motor_act',
      motor: {
        steppers: [{
          stepperid: parseInt(document.getElementById('motorStepperId').value),
          position: 0, speed: 0, isabs: 0, stop: 1
        }]
      }
    };
    sendHwSerialCommand(JSON.stringify(cmd));
  });

  // Hardware test - Laser controls
  const laserValue = document.getElementById('laserValue');
  laserValue?.addEventListener('input', (e) => {
    document.getElementById('laserValueDisplay').textContent = e.target.value;
  });

  document.getElementById('laserOn')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('laserId').value);
    sendHwSerialCommand(JSON.stringify({ task: '/laser_act', LASERid: id, LASERval: 1000 }));
  });

  document.getElementById('laserOff')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('laserId').value);
    sendHwSerialCommand(JSON.stringify({ task: '/laser_act', LASERid: id, LASERval: 0 }));
  });

  document.getElementById('laserSetValue')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('laserId').value);
    const val = parseInt(document.getElementById('laserValue').value);
    sendHwSerialCommand(JSON.stringify({ task: '/laser_act', LASERid: id, LASERval: val }));
  });

  // Hardware test - Homing
  document.getElementById('homeStart')?.addEventListener('click', () => {
    const cmd = {
      task: '/home_act',
      home: {
        steppers: [{
          stepperid: parseInt(document.getElementById('homeStepperId').value),
          timeout: parseInt(document.getElementById('homeTimeout').value),
          speed: parseInt(document.getElementById('homeSpeed').value),
          direction: parseInt(document.getElementById('homeDirection').value),
          endstoppolarity: parseInt(document.getElementById('homeEndstopPolarity').value),
          endstoprelease: parseInt(document.getElementById('homeEndstopRelease').value)
        }]
      }
    };
    sendHwSerialCommand(JSON.stringify(cmd));
  });

  // ESP Web Tools - Post-flash configure redirect
  const installButton = document.getElementById('installButton');
  installButton.addEventListener('state-changed', (e) => {
    console.log('Install state:', e.detail);

    // When flashing starts, disconnect any existing serial connections
    // so they don't become stale after the device resets
    if (e.detail.state === 'initializing' || e.detail.state === 'preparing') {
      if (state.isConnected) {
        disconnectSerial().catch(() => {});
      }
      if (state.hwIsConnected) {
        disconnectHwSerial().catch(() => {});
      }
    }

    if (e.detail.state === 'finished') {
      logToConsole('\u2713 Firmware flashed successfully!', 'success');

      if (document.getElementById('postFlashConfig')?.checked) {
        // Switch to Configure tab immediately (it appears behind the esp-web-tools dialog)
        const configTab = document.getElementById('configure-tab');
        if (configTab) {
          new bootstrap.Tab(configTab).show();
        }

        // Show a post-flash banner in the Configure tab
        const banner = document.getElementById('postFlashBanner');
        if (banner) {
          banner.classList.remove('hidden');
        }

        // Also poll for the ESP Web Tools dialog to be removed from DOM,
        // then scroll the banner into view
        const checkInterval = setInterval(() => {
          const dialog = document.querySelector('ewt-install-dialog');
          if (!dialog) {
            clearInterval(checkInterval);
            if (banner) banner.scrollIntoView({ behavior: 'smooth' });
            logToConsole('\u2192 Connect to your device to configure CAN ID and other settings.', 'info');
          }
        }, 500);
        // Safety: stop checking after 2 minutes
        setTimeout(() => clearInterval(checkInterval), 120000);
      }
    }
  });
}

// =====================================================
// Initialization
// =====================================================

async function init() {
  // Check WebSerial support
  if (!('serial' in navigator)) {
    document.getElementById('browserWarning')?.classList.remove('hidden');
  }

  parseUrlParams();
  await loadReleases();
  setupEventListeners();
  renderBoards();
  updateDirectLink();

  // Initialize hardware test controls
  initHardwareTest();
}

// Start application
init();
