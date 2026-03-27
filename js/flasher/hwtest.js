// js/flasher/hwtest.js
// Hardware test controls merged from indexWebSerialTest.html

import { sendHwSerialCommand } from './serial.js';

// =====================================================
// Light Source / PWM Control
// =====================================================

const lastLightValue = [0, 0, 0, 0, 0];

function setLight(channel, value) {
  const v = Math.max(0, Math.min(1023, parseInt(value)));
  lastLightValue[channel] = v;
  sendHwSerialCommand(JSON.stringify({ task: '/laser_act', LASERid: channel, LASERval: v }));
}

function setupLightChannel(ch) {
  const onBtn = document.getElementById(`hwLight${ch}OnBtn`);
  const offBtn = document.getElementById(`hwLight${ch}OffBtn`);
  const slider = document.getElementById(`hwLight${ch}Slider`);
  const valueInput = document.getElementById(`hwLight${ch}Value`);

  if (!onBtn || !offBtn || !slider || !valueInput) return;

  onBtn.addEventListener('click', () => {
    slider.disabled = false;
    valueInput.disabled = false;
    const val = lastLightValue[ch] || 512;
    setLight(ch, val);
    slider.value = val;
    valueInput.value = val;
  });

  offBtn.addEventListener('click', () => {
    setLight(ch, 0);
    slider.disabled = true;
    valueInput.disabled = true;
  });

  slider.addEventListener('input', function () {
    valueInput.value = this.value;
    setLight(ch, this.value);
  });

  valueInput.addEventListener('change', function () {
    slider.value = this.value;
    setLight(ch, this.value);
  });
}

// =====================================================
// Motor Jog Control (per-axis quick buttons)
// =====================================================

function setupAxisJog(axisName, stepperId) {
  const stepInput = document.getElementById(`hwStep${axisName}`);
  const plusBtn = document.getElementById(`hw${axisName}Plus`);
  const minusBtn = document.getElementById(`hw${axisName}Minus`);
  const foreverPlusBtn = document.getElementById(`hw${axisName}ForeverPlus`);
  const foreverMinusBtn = document.getElementById(`hw${axisName}ForeverMinus`);
  const stopBtn = document.getElementById(`hw${axisName}Stop`);

  if (!plusBtn) return;

  plusBtn.addEventListener('click', () => {
    const steps = parseInt(stepInput.value) || 1000;
    sendHwSerialCommand(JSON.stringify({
      task: '/motor_act',
      motor: { steppers: [{ stepperid: stepperId, position: steps, speed: 15000, isabs: 0, isaccel: 0 }] }
    }));
  });

  minusBtn.addEventListener('click', () => {
    const steps = parseInt(stepInput.value) || 1000;
    sendHwSerialCommand(JSON.stringify({
      task: '/motor_act',
      motor: { steppers: [{ stepperid: stepperId, position: -steps, speed: 15000, isabs: 0, isaccel: 0 }] }
    }));
  });

  foreverPlusBtn.addEventListener('click', () => {
    sendHwSerialCommand(JSON.stringify({
      task: '/motor_act',
      motor: { steppers: [{ stepperid: stepperId, isforever: 1, speed: 1500 }] }
    }));
  });

  foreverMinusBtn.addEventListener('click', () => {
    sendHwSerialCommand(JSON.stringify({
      task: '/motor_act',
      motor: { steppers: [{ stepperid: stepperId, isforever: 1, speed: -1500 }] }
    }));
  });

  stopBtn.addEventListener('click', () => {
    sendHwSerialCommand(JSON.stringify({
      task: '/motor_act',
      motor: { steppers: [{ stepperid: stepperId, isstop: 1 }] }
    }));
  });
}

// =====================================================
// LED Matrix (8x8)
// =====================================================

function createLEDMatrix() {
  const container = document.getElementById('hwLedMatrix');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 64; i++) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-secondary';
    btn.textContent = i;
    btn.addEventListener('click', function () {
      const isActive = this.classList.contains('btn-success');
      const color = isActive ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
      sendHwSerialCommand(JSON.stringify({
        task: '/ledarr_act',
        led: { action: 'single', ledIndex: i, ...color }
      }));
      this.classList.toggle('btn-outline-secondary', isActive);
      this.classList.toggle('btn-success', !isActive);
    });
    container.appendChild(btn);
  }
}

// =====================================================
// Initialize All Hardware Test Controls
// =====================================================

export function initHardwareTest() {
  // Light source channels 0-4
  for (let ch = 0; ch < 5; ch++) {
    setupLightChannel(ch);
  }

  // Motor jog axes: A=0, X=1, Y=2, Z=3
  setupAxisJog('A', 0);
  setupAxisJog('X', 1);
  setupAxisJog('Y', 2);
  setupAxisJog('Z', 3);

  // LED Array controls
  document.getElementById('hwLedFullOn')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"fill","r":255,"g":255,"b":255}}');
  });
  document.getElementById('hwLedFullOff')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"off"}}');
  });
  document.getElementById('hwLedLeft')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"halves","region":"left","r":255,"g":255,"b":255}}');
  });
  document.getElementById('hwLedRight')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"halves","region":"right","r":255,"g":255,"b":255}}');
  });
  document.getElementById('hwLedTop')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"halves","region":"top","r":255,"g":255,"b":255}}');
  });
  document.getElementById('hwLedBottom')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"halves","region":"bottom","r":255,"g":255,"b":255}}');
  });
  document.getElementById('hwLedOuterRing')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"rings","radius":5,"r":255,"g":255,"b":255}}');
  });
  document.getElementById('hwLedMiddleRing')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"rings","radius":3,"r":255,"g":255,"b":255}}');
  });
  document.getElementById('hwLedInnerRing')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/ledarr_act","qid":17,"led":{"action":"rings","radius":2,"r":255,"g":255,"b":255}}');
  });

  // LED Matrix (8x8)
  createLEDMatrix();

  // Motor enable/disable
  document.getElementById('hwMotorEnable')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/motor_act","isen":1,"isenauto":1}');
  });
  document.getElementById('hwMotorDisable')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/motor_act","isen":1,"isenauto":0}');
  });

  // TMC Driver settings
  document.getElementById('hwTmcUpdate')?.addEventListener('click', () => {
    const cmd = {
      task: '/tmc_act',
      msteps: parseInt(document.getElementById('hwTmcMsteps').value) || 16,
      rms_current: parseInt(document.getElementById('hwTmcRms').value) || 700,
      sgthrs: parseInt(document.getElementById('hwTmcSgthrs').value) || 15,
      semin: parseInt(document.getElementById('hwTmcSemin').value) || 5,
      semax: parseInt(document.getElementById('hwTmcSemax').value) || 2,
      blank_time: parseInt(document.getElementById('hwTmcBlank').value) || 24,
      toff: parseInt(document.getElementById('hwTmcToff').value) || 4,
      axis: parseInt(document.getElementById('hwTmcAxis').value) || 2
    };
    sendHwSerialCommand(JSON.stringify(cmd));
  });

  // CAN Address
  document.getElementById('hwCanUpdate')?.addEventListener('click', () => {
    const address = parseInt(document.getElementById('hwCanAddress').value);
    if (!isNaN(address)) {
      sendHwSerialCommand(JSON.stringify({ task: '/can_act', address }));
    }
  });
  // CAN Address presets
  document.querySelectorAll('.hw-can-preset').forEach(preset => {
    preset.addEventListener('click', () => {
      document.querySelectorAll('.hw-can-preset').forEach(p => p.classList.remove('selected'));
      preset.classList.add('selected');
      const address = parseInt(preset.dataset.address);
      document.getElementById('hwCanAddress').value = address;
      sendHwSerialCommand(JSON.stringify({ task: '/can_act', address }));
    });
  });

  // BT Pairing
  document.getElementById('hwBtPair')?.addEventListener('click', () => {
    sendHwSerialCommand('{"task":"/bt_scan"}');
  });
}
