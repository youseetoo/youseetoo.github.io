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
  'esp32-uc2-v4-can': {
    name: 'UC2 V4 CAN Master',
    image: './IMAGES/esp32-uc2-v4.png',
    chip: 'ESP32',
    description: 'UC2 V4 with CAN bus master functionality',
    canConfig: true,
    defaultCanId: 1,
    category: 'electrobox'
  },
  'esp32-uc2-v4-can-hybrid': {
    name: 'UC2 V4 CAN Hybrid',
    image: './IMAGES/esp32-uc2-v4.png',
    chip: 'ESP32',
    description: 'UC2 V4 with native and CAN motors',
    canConfig: true,
    defaultCanId: 1,
    category: 'electrobox'
  },
  'can-hat-master-v2': {
    name: 'CAN HAT Master V2 (FRAME)',
    image: './IMAGES/openuc2-HATv1.png',
    chip: 'ESP32',
    description: 'Raspberry Pi HAT with CAN Master',
    canConfig: true,
    defaultCanId: 1,
    category: 'frame'
  },
  'seeed_xiao_esp32s3': {
    name: 'Xiao ESP32S3 ODMR',
    image: 'https://quantumminilabs.de/wp-content/uploads/2025/01/cropped-Quantumminilabs_Logo.png',
    chip: 'ESP32-S3',
    description: 'Seeed Xiao ESP32S3 for ODMR applications',
    canConfig: false,
    category: 'qbox'
  },
  'seeed_xiao_esp32s3_ledservo': {
    name: 'Xiao LED & Servo',
    image: './IMAGES/ledboard.jpg',
    chip: 'ESP32-S3',
    description: 'Xiao board for LED and servo control',
    canConfig: false,
    category: 'frame'
  },
  'seeed_xiao_esp32s3_ledring': {
    name: 'Xiao LED Ring',
    image: './IMAGES/esp32-uc2-ledring.jpg',
    chip: 'ESP32-S3',
    description: 'Xiao board with LED ring for brightfield',
    canConfig: true,
    category: 'frame'
  },
  'xiao-can-slave-motor': {
    name: 'Xiao CAN Slave Motor',
    image: './IMAGES/esp32s3-uc2-motor.jpg',
    chip: 'ESP32-S3',
    description: 'CAN slave for motor control',
    canConfig: true,
    canPresets: ['X-Axis', 'Y-Axis', 'Z-Axis', 'A-Axis'],
    category: 'frame'
  },
  'xiao-can-slave-galvo': {
    name: 'Xiao CAN Slave Galvo',
    image: './IMAGES/esp32-uc2-xiao-can-galvo.png',
    chip: 'ESP32-S3',
    description: 'CAN slave for galvo mirror control',
    canConfig: true,
    defaultCanId: 15,
    category: 'frame'
  },
  'xiao-can-slave-laser': {
    name: 'Xiao CAN Slave Laser',
    image: './IMAGES/esp32-uc2-xiao-can-laser.png',
    chip: 'ESP32-S3',
    description: 'CAN slave for laser control',
    canConfig: true,
    defaultCanId: 20,
    category: 'frame'
  },
  'xiao-can-slave-led': {
    name: 'Xiao CAN Slave LED',
    image: './IMAGES/esp32-uc2-xiao-can-ledring.png',
    chip: 'ESP32-S3',
    description: 'CAN slave for LED control',
    canConfig: true,
    defaultCanId: 30,
    category: 'frame'
  },
  'xiao-can-slave-illumination': {
    name: 'Xiao CAN Slave Illumination',
    image: './IMAGES/esp32-uc2-xiao-can-ledring.png',
    chip: 'ESP32-S3',
    description: 'CAN slave for LED array control',
    canConfig: true,
    defaultCanId: 30,
    category: 'frame'
  },
  'odmr-xiao-esp32s3': {
    name: 'ODMR Xiao ESP32S3',
    image: 'https://quantumminilabs.de/wp-content/uploads/2025/01/cropped-Quantumminilabs_Logo.png',
    chip: 'ESP32-S3',
    description: 'Quantum ODMR spectroscopy board (ESP32-S3)',
    canConfig: false,
    category: 'qbox'
  },
  'odmr-xiao-esp32c3': {
    name: 'ODMR Xiao ESP32C3',
    image: 'https://quantumminilabs.de/wp-content/uploads/2025/01/cropped-Quantumminilabs_Logo.png',
    chip: 'ESP32-C3',
    description: 'Quantum ODMR spectroscopy board (ESP32-C3)',
    canConfig: false,
    category: 'qbox'
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
