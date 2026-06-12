// js/flasher/config.js
// Board configurations and application constants

export const GITHUB_REPO = 'youseetoo/uc2-esp32';
export const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`;
export const BINARIES_REPO = 'youseetoo/uc2-esp32-binaries';
export const RAW_BASE = `https://raw.githubusercontent.com/${BINARIES_REPO}/refs/heads`;
export const IMSWITCH_REPO = 'openUC2/rpi-imswitch-os';
export const IMSWITCH_API = `https://api.github.com/repos/${IMSWITCH_REPO}`;

// Board configurations with images and metadata
// Categories: frame, electrobox, qbox, standalone
export const BOARD_CONFIG = {
  'esp32-uc2-wemos': {
    name: 'ESP32 WEMOS D1 R32',
    image: './IMAGES/esp32-uc2-wemos.jpg',
    chip: 'ESP32',
    description: 'Off-the-shelf board for use with CNC Shield v3',
    canConfig: false,
    category: 'standalone'
  },
  'esp32-uc2-standalone-2': {
    name: 'Standalone Board V2',
    image: './IMAGES/esp32-uc2-standalone-2.png',
    chip: 'ESP32',
    description: 'UC2 Standalone PCB Version 2',
    canConfig: false,
    category: 'standalone'
  },
  'esp32-uc2-standalone-3': {
    name: 'Standalone Board V3',
    image: './IMAGES/esp32-uc2-standalone-3.png',
    chip: 'ESP32',
    description: 'UC2 Standalone PCB Version 3',
    canConfig: false,
    category: 'standalone'
  },
  'esp32-uc2-standalone-4': {
    name: 'Standalone Board V4',
    image: './IMAGES/esp32-uc2-v4.png',
    chip: 'ESP32',
    description: 'UC2 Standalone PCB Version 4',
    canConfig: true,
    category: 'electrobox'
  },
  // ── CANopen Master / Standalone ──────────────────────────────────────────
  'uc2-can-master': {
    name: 'CANopen Master (ESP32-dev)',
    image: './IMAGES/esp32-uc2-v4.png',
    chip: 'ESP32',
    description: 'CANopen master node – ESP32-dev, all controllers + DeviceRouter (node-id 1)',
    canConfig: true,
    defaultCanId: 1,
    category: 'electrobox'
  },
  'uc2-can-standalone-v4': {
    name: 'CANopen Standalone V4',
    image: './IMAGES/esp32-uc2-v4.png',
    chip: 'ESP32',
    description: 'UC2 V4 board – standalone CANopen, all controllers, TCA9535 I/O expander',
    canConfig: true,
    defaultCanId: 1,
    category: 'electrobox'
  },
  // ── CANopen Slaves (XIAO ESP32-S3) ───────────────────────────────────────
  'uc2-can-slave-motor': {
    name: 'CANopen Slave: Motor (FastAccel)',
    image: './IMAGES/esp32s3-uc2-motor.jpg',
    chip: 'ESP32-S3',
    description: 'XIAO ESP32S3 CANopen slave – stepper motor (FastAccelStepper), TMC, encoder (node-id 10–15)',
    canConfig: true,
    canPresets: ['X-Axis', 'Y-Axis', 'Z-Axis', 'A-Axis'],
    defaultCanId: 10,
    category: 'frame'
  },
  'uc2-can-slave-accelmotor': {
    name: 'CANopen Slave: Motor (AccelStepper)',
    image: './IMAGES/esp32s3-uc2-motor.jpg',
    chip: 'ESP32-S3',
    description: 'XIAO ESP32S3 CANopen slave – stepper motor (AccelStepper), TMC, encoder (node-id 10–15)',
    canConfig: true,
    canPresets: ['X-Axis', 'Y-Axis', 'Z-Axis', 'A-Axis'],
    defaultCanId: 10,
    category: 'frame'
  },
  'uc2-can-slave-laser': {
    name: 'CANopen Slave: Laser',
    image: './IMAGES/esp32-uc2-xiao-can-laser.png',
    chip: 'ESP32-S3',
    description: 'XIAO ESP32S3 CANopen slave – laser channel (node-id 20–23)',
    canConfig: true,
    defaultCanId: 20,
    category: 'frame'
  },
  'uc2-can-slave-led': {
    name: 'CANopen Slave: LED',
    image: './IMAGES/esp32-uc2-xiao-can-ledring.png',
    chip: 'ESP32-S3',
    description: 'XIAO ESP32S3 CANopen slave – NeoPixel LED array (node-id 25)',
    canConfig: true,
    defaultCanId: 25,
    category: 'frame'
  },
  'uc2-can-slave-galvo': {
    name: 'CANopen Slave: Galvo',
    image: './IMAGES/esp32-uc2-xiao-can-galvo.png',
    chip: 'ESP32-S3',
    description: 'XIAO ESP32S3 CANopen slave – galvo mirror / MCP4822 SPI DAC (node-id 30+)',
    canConfig: true,
    defaultCanId: 30,
    category: 'frame'
  },
  'uc2-can-slave-gpio': {
    name: 'CANopen Slave: GPIO',
    image: './IMAGES/placeholder.svg',
    chip: 'ESP32-S3',
    description: 'XIAO ESP32S3 CANopen slave – E-stop, collision sensor, 2 remote GPIOs (node-id 60)',
    canConfig: true,
    defaultCanId: 60,
    category: 'frame'
  },
  'uc2-can-bridge-ps4-usbhost': {
    name: 'CANopen Bridge: PS4 USB',
    image: './IMAGES/placeholder.svg',
    chip: 'ESP32-S3',
    description: 'XIAO ESP32S3 – DualShock 4 USB-OTG HID host → CANopen SDO bridge',
    canConfig: false,
    category: 'frame'
  },
  // ── ODMR (manifest loaded from youseetoo.github.io, not uc2-esp32-binaries) ──
  'odmr-xiao-esp32s3': {
    name: 'ODMR Xiao ESP32S3',
    image: 'https://quantumminilabs.de/wp-content/uploads/2025/01/cropped-Quantumminilabs_Logo.png',
    chip: 'ESP32-S3',
    description: 'Quantum ODMR spectroscopy board (ESP32-S3)',
    canConfig: false,
    category: 'qbox',
    manifestUrl: 'https://raw.githubusercontent.com/youseetoo/youseetoo.github.io/refs/heads/main/static/firmware_build/odmr-xiao-esp32s3-manifest.json'
  },
  'odmr-xiao-esp32c3': {
    name: 'ODMR Xiao ESP32C3',
    image: 'https://quantumminilabs.de/wp-content/uploads/2025/01/cropped-Quantumminilabs_Logo.png',
    chip: 'ESP32-C3',
    description: 'Quantum ODMR spectroscopy board (ESP32-C3)',
    canConfig: false,
    category: 'qbox',
    manifestUrl: 'https://raw.githubusercontent.com/youseetoo/youseetoo.github.io/refs/heads/main/static/firmware_build/odmr-xiao-esp32c3-manifest.json'
  },
  'waveshare_esp32s3_ledarray': {
    name: 'Waveshare ESP32S3 Matrix',
    image: './IMAGES/waveshare.webp',
    chip: 'ESP32-S3',
    description: 'Waveshare ESP32S3 with LED matrix',
    canConfig: false,
    category: 'electrobox'
  }
};

// Shared application state
export const state = {
  releases: [],
  imswitchReleases: [],
  currentRelease: null,
  selectedBoard: null,
  serialPort: null,
  serialReader: null,
  serialWriter: null,
  isConnected: false,
  hwSerialPort: null,
  hwSerialReader: null,
  hwSerialWriter: null,
  hwIsConnected: false,
  currentCategory: 'all'
};
