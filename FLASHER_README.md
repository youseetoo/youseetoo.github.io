# UC2 ESP32 Firmware Flash Tool

A modern, browser-based firmware flashing tool for UC2 ESP32 boards.

## Features

### 🚀 Flash Firmware
- Select from all available UC2 board variants
- Choose specific firmware versions from GitHub releases
- Direct flashing via WebSerial (Chrome/Edge/Opera)
- Pre-selectable via URL parameters

### ⚙️ Configure Device
- Send serial commands after flashing
- Configure CAN bus IDs for multi-axis setups
- Quick command presets for common operations
- Real-time console output

### 🗑️ Erase Flash
- Full flash erase for troubleshooting
- NVS-only erase to reset settings
- Based on official esptool.js

## URL Parameters

The flasher supports URL parameters for direct linking to specific configurations:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `firmware` | Board ID to pre-select | `?firmware=can-hat-master-v2` |
| `release` | Version tag to select | `?release=v1.9` |
| `tab` | Tab to open | `?tab=configure` |
| `canid` | Pre-fill CAN ID | `?canid=11` |

### Examples

```
# Flash CAN HAT Master V2 with version v1.9
https://youseetoo.github.io/flasher.html?firmware=can-hat-master-v2&release=v1.9

# Flash Xiao Motor as X-Axis (CAN ID 11)
https://youseetoo.github.io/flasher.html?firmware=xiao-can-slave-motor&canid=11

# Open configure tab directly
https://youseetoo.github.io/flasher.html?tab=configure
```

## CAN ID Reference

For CAN bus setups, use these standard addresses:

| Role | Address | Description |
|------|---------|-------------|
| Master | 1 | Main controller |
| A-Axis | 10 | Motor axis A |
| X-Axis | 11 | Motor axis X |
| Y-Axis | 12 | Motor axis Y |
| Z-Axis | 13 | Motor axis Z |
| LED | 30 | LED array controller |

## Board IDs

Available board IDs for the `firmware` parameter:

- `esp32-uc2-wemos` - WEMOS D1 R32
- `esp32-uc2-standalone-2` - Standalone V2
- `esp32-uc2-standalone-3` - Standalone V3
- `esp32-uc2-standalone-4` - Standalone V4
- `esp32-uc2-v4-can` - V4 CAN Master
- `esp32-uc2-v4-can-hybrid` - V4 CAN Hybrid
- `can-hat-master-v2` - CAN HAT Master V2
- `seeed_xiao_esp32s3` - Xiao ESP32S3
- `seeed_xiao_esp32s3_ledservo` - Xiao LED & Servo
- `seeed_xiao_esp32s3_ledring` - Xiao LED Ring
- `xiao-can-slave-motor` - Xiao CAN Slave Motor
- `xiao-can-slave-illumination` - Xiao CAN Slave Illumination
- `waveshare_esp32s3_ledarray` - Waveshare Matrix

## Development

The flasher uses:
- [ESP Web Tools](https://github.com/esphome/esp-web-tools) for firmware flashing
- [esptool-js](https://github.com/nicola/esptool-js) for flash erasing
- [WebSerial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) for communication
- Bootstrap 5 for UI

## Creating Releases

To create a new firmware release:

1. Tag the commit with a version (e.g., `v1.9`)
2. Push the tag: `git push origin v1.9`
3. GitHub Actions will automatically:
   - Build all firmware variants
   - Create manifest files
   - Upload to GitHub Releases
   - Update the flasher tool

## Browser Support

WebSerial is required for flashing and configuration. Supported browsers:
- Google Chrome 89+
- Microsoft Edge 89+
- Opera 75+

**Not supported:** Firefox, Safari

## License

MIT License - see [LICENSE](LICENSE) for details.
