# UC2 ESP32 Firmware Flasher - Updated

Modern web-based firmware flasher for UC2 ESP32 boards with support for WebSerial flashing, post-flash configuration, and **multi-repository firmware support**.

## What's New

### ✨ Multi-Repository Support
- **UC2 Main Firmware**: All UC2 boards, Xiao variants, CAN slaves
- **ODMR Firmware**: External quantum spectroscopy boards from separate repository
- Automatic manifest loading from different sources

### 📦 New Boards Added
- `xiao-can-slave-galvo` - Galvo mirror control (CAN ID 15)
- `xiao-can-slave-laser` - Laser control (CAN ID 20)
- `xiao-can-slave-led` - LED control (CAN ID 30)
- `odmr-xiao-esp32s3` - ODMR ESP32-S3 quantum board
- `odmr-xiao-esp32c3` - ODMR ESP32-C3 quantum board

## Features

### 🔥 Flash Firmware
- **Browser-based flashing** using ESP Web Tools (Chrome/Edge/Opera)
- **Version selection** from GitHub releases
- **17 different board types** supported
- **Direct links** for preselecting board and version
- **Automatic manifest generation** from GitHub releases

### ⚙️ Configure Device
- **Post-flash configuration** via WebSerial
- **CAN ID setup** with preset buttons (Master, X, Y, Z, A, LED)
- **Serial monitor** for real-time communication
- **Custom commands** for advanced users

### 🗑️ Erase Flash
- **Full flash erase** using esptool-js
- **NVS erase only** to preserve application
- **Progress tracking** with detailed logs

## URL Parameters

Share direct links to specific configurations:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `firmware` | Board ID to preselect | `?firmware=can-hat-master-v2` |
| `release` | Version to use | `?release=v1.9` |
| `tab` | Active tab to show | `?tab=configure` |
| `canid` | CAN ID to preset | `?canid=11` |

### Example URLs

```
# Flash CAN HAT Master V2 with specific version
https://youseetoo.github.io/flasher.html?firmware=can-hat-master-v2&release=v1.9

# Flash Xiao Motor as X-Axis (CAN ID 11)
https://youseetoo.github.io/flasher.html?firmware=xiao-can-slave-motor&canid=11

# Flash ODMR quantum board
https://youseetoo.github.io/flasher.html?firmware=odmr-xiao-esp32s3

# Open configure tab directly
https://youseetoo.github.io/flasher.html?tab=configure
```

## Board IDs

### UC2 Main Boards (youseetoo/uc2-esp32)
- `esp32-uc2-wemos` - WEMOS D1 R32
- `esp32-uc2-standalone-2` - Standalone V2
- `esp32-uc2-standalone-3` - Standalone V3
- `esp32-uc2-standalone-4` - Standalone V4
- `esp32-uc2-v4-can` - V4 CAN Master
- `esp32-uc2-v4-can-hybrid` - V4 CAN Hybrid
- `can-hat-master-v2` - CAN HAT Master V2

### Seeed Xiao Boards
- `seeed_xiao_esp32s3` - Xiao ESP32S3 ODMR (UC2)
- `seeed_xiao_esp32s3_ledservo` - Xiao LED & Servo
- `seeed_xiao_esp32s3_ledring` - Xiao LED Ring

### CAN Slave Boards (ESP32-S3)
- `xiao-can-slave-motor` - Motor Control (X/Y/Z/A axes)
- `xiao-can-slave-galvo` - Galvo Mirror Control ⭐ NEW
- `xiao-can-slave-laser` - Laser Control ⭐ NEW
- `xiao-can-slave-led` - LED Control ⭐ NEW
- `xiao-can-slave-illumination` - Illumination Control

### ODMR Quantum Boards (openUC2/TechnicalDocs-openUC2-QBox) ⭐ NEW
- `odmr-xiao-esp32s3` - ODMR ESP32-S3
- `odmr-xiao-esp32c3` - ODMR ESP32-C3

### Other Boards
- `waveshare_esp32s3_ledarray` - Waveshare LED Matrix

## CAN ID Reference

Common CAN addresses for slave devices:

| Device Type | CAN ID | Preset Button |
|-------------|--------|---------------|
| Master | 1 | Master |
| A-Axis Motor | 10 | A-Axis |
| X-Axis Motor | 11 | X-Axis |
| Y-Axis Motor | 12 | Y-Axis |
| Z-Axis Motor | 13 | Z-Axis |
| Galvo Mirror | 15 | - |
| Laser | 20 | - |
| LED Array | 30 | LED |

## Firmware Build System

### UC2 Main Firmware
- **Repository**: `youseetoo/uc2-esp32`
- **Workflow**: `.github/workflows/build-and-release.yaml`
- **Trigger**: Git tags (e.g., `v1.9`) or manual dispatch
- **Output**: GitHub Releases with all board variants

### ODMR Firmware (External)
- **Repository**: `openUC2/TechnicalDocs-openUC2-QBox`
- **Workflow**: `.github/workflows/build-odmr-external.yaml` (in uc2-esp32 repo)
- **Trigger**: Weekly schedule or manual dispatch
- **Output**: Uploaded to `youseetoo.github.io/static/firmware_odmr/`
- **Boards**: ESP32-S3 and ESP32-C3 variants

## How It Works

1. **Flasher loads** → Fetches releases from GitHub API
2. **User selects board** → Determines manifest source:
   - UC2 boards: GitHub Release assets
   - ODMR boards: Local path (`/static/firmware_odmr/`)
3. **Install clicked** → ESP Web Tools handles flashing
4. **Post-flash** (optional) → WebSerial sends CAN ID configuration

## Development

### Local Testing

```bash
# Serve locally
cd /path/to/youseetoo.github
python -m http.server 8000

# Access flasher
open http://localhost:8000/flasher.html
```

### Building UC2 Firmware Manually

```bash
cd /path/to/uc2-ESP

# Build specific environment
pio run -e UC2_4_CAN

# Build all environments (automated by GitHub Actions)
# See .github/workflows/build-and-release.yaml
```

### Triggering ODMR Firmware Build

```bash
# Via GitHub UI: Actions → Build ODMR Firmware → Run workflow

# Or schedule runs automatically every Monday at 2 AM UTC
```

### Adding New Boards

1. **Add to platformio.ini** (if UC2 firmware):
```ini
[env:new_board]
extends = env:base
build_flags = -DNEW_FEATURE=1
```

2. **Add to build workflow** (`.github/workflows/build-and-release.yaml`):
```yaml
- env_name: new_board
  display_name: "New Board Name"
  board_id: "new-board-id"
  chip_family: "ESP32-S3"
```

3. **Add to flasher** (`flasher.html` BOARD_CONFIG):
```javascript
'new-board-id': {
  name: 'New Board Name',
  image: './IMAGES/new-board.jpg',
  chip: 'ESP32-S3',
  description: 'Board description',
  canConfig: true,
  defaultCanId: 11,
  // Optional: for external repos
  externalRepo: 'https://github.com/org/repo',
  manifestPath: '/static/firmware_custom/'
}
```

4. **Push changes and create release tag**:
```bash
git add .
git commit -m "Add new board support"
git push

# Create version tag to trigger build
git tag v1.10
git push origin v1.10
```

## Browser Compatibility

**Supported**: Chrome, Edge, Opera (WebSerial API required)  
**Not Supported**: Firefox, Safari

## License

MIT License - See repository for details

## Links

- Main Repository: https://github.com/youseetoo/uc2-esp32
- ODMR Repository: https://github.com/openUC2/TechnicalDocs-openUC2-QBox
- Web Flasher: https://youseetoo.github.io/flasher.html
- UC2 Project: https://github.com/openUC2
