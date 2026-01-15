# UC2 Firmware Release System - Simplified Architecture

## Overview

All UC2 firmware (including ODMR quantum boards) is now centralized in **GitHub Releases** at `youseetoo/uc2-esp32`. The web flasher loads manifests directly from GitHub releases, which have proper CORS headers for cross-origin requests.

## Why This Works

### CORS Problem Solved
- **GitHub Release Assets** served via `githubusercontent.com` have CORS headers
- **GitHub API** (`api.github.com`) has CORS headers for listing releases
- **ESP Web Tools** can load manifests from any URL with CORS support
- **Result**: No need for local manifest hosting

### Versioning Maintained
- Each git tag creates a new release (e.g., `v2026.01.15`)
- Users can select any previous version from dropdown
- Manifests and binaries are permanently stored in releases
- Full version history preserved

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  youseetoo.github.io/flasher.html                           │
│  (Hosted on GitHub Pages)                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──► GitHub API (api.github.com)
                   │    • Get list of releases
                   │    • Get asset URLs
                   │    ✓ Has CORS headers
                   │
                   ├──► GitHub Releases (githubusercontent.com)
                   │    • Load manifests
                   │    • Load firmware binaries
                   │    ✓ Has CORS headers
                   │
                   └──► User's ESP32 Device (via WebSerial)
                        • Flash firmware
                        • Configure CAN ID
                        • Erase flash
```

## Build & Release Workflow

### 1. UC2 Main Firmware
**Repository**: `youseetoo/uc2-esp32`  
**Workflow**: `.github/workflows/build-and-release.yaml`

```bash
# Create new release
cd uc2-ESP
git add .
git commit -m "New features/fixes"
git tag v2026.01.15
git push origin v2026.01.15
```

**Automated Process**:
1. Build all 14 board variants
2. Merge binaries (bootloader + partitions + app)
3. Generate ESP Web Tools manifests
4. Create GitHub Release with all assets
5. Update `LATEST_VERSION` file

### 2. ODMR Quantum Firmware
**Source Repository**: `openUC2/TechnicalDocs-openUC2-QBox`  
**Build Workflow**: `.github/workflows/build-odmr-external.yaml` (in uc2-esp32 repo)  
**Target**: Also published to `youseetoo/uc2-esp32` releases

```bash
# Trigger ODMR build manually
# GitHub UI: Actions → Build ODMR Firmware → Run workflow
```

**Automated Process**:
1. Clone ODMR repository
2. Build ESP32-S3 and ESP32-C3 variants
3. Create separate release (e.g., `odmr-2026.01.15`)
4. Upload to same repository for unified access

## Manifest Format

All manifests follow ESP Web Tools specification:

```json
{
  "name": "Board Display Name",
  "version": "v2026.01.15",
  "home_assistant_domain": "UC2-ESP32",
  "funding_url": "https://github.com/youseetoo/uc2-esp32",
  "builds": [
    {
      "chipFamily": "ESP32",
      "parts": [
        {
          "path": "board-id.bin",
          "offset": 0
        }
      ]
    }
  ]
}
```

**Key Points**:
- `path` is relative to manifest location (same GitHub release)
- GitHub automatically serves both manifest and binary from same CDN
- No CORS issues because both are from `githubusercontent.com`

## Flasher.html Logic

### Release Loading
```javascript
// Load releases from GitHub API
const response = await fetch('https://api.github.com/repos/youseetoo/uc2-esp32/releases');
const releases = await response.json();

// Populate dropdown
releases.forEach(release => {
  // Add to version selector
});
```

### Manifest URL Construction
```javascript
// User selects board + version
const manifestUrl = release.assets
  .find(a => a.name === `${boardId}-manifest.json`)
  .browser_download_url;

// Example: https://github.com/youseetoo/uc2-esp32/releases/download/v2026.01.15/esp32-uc2-wemos-manifest.json
```

### Binary Loading
ESP Web Tools automatically loads binary based on manifest's `path` field:
```javascript
// Manifest specifies: "path": "esp32-uc2-wemos.bin"
// ESP Web Tools resolves to same release:
// https://github.com/youseetoo/uc2-esp32/releases/download/v2026.01.15/esp32-uc2-wemos.bin
```

## Available Boards

### UC2 Main Firmware (14 variants)
| Board ID | Name | Chip |
|----------|------|------|
| `esp32-uc2-wemos` | WEMOS D1 R32 | ESP32 |
| `esp32-uc2-standalone-2` | Standalone V2 | ESP32 |
| `esp32-uc2-standalone-3` | Standalone V3 | ESP32 |
| `esp32-uc2-standalone-4` | Standalone V4 | ESP32 |
| `esp32-uc2-v4-can` | V4 CAN Master | ESP32 |
| `esp32-uc2-v4-can-hybrid` | V4 CAN Hybrid | ESP32 |
| `can-hat-master-v2` | CAN HAT Master V2 | ESP32 |
| `seeed_xiao_esp32s3` | Xiao ESP32S3 | ESP32-S3 |
| `seeed_xiao_esp32s3_ledservo` | Xiao LED & Servo | ESP32-S3 |
| `seeed_xiao_esp32s3_ledring` | Xiao LED Ring | ESP32-S3 |
| `xiao-can-slave-motor` | Xiao CAN Motor | ESP32-S3 |
| `xiao-can-slave-galvo` | Xiao CAN Galvo | ESP32-S3 |
| `xiao-can-slave-laser` | Xiao CAN Laser | ESP32-S3 |
| `xiao-can-slave-led` | Xiao CAN LED | ESP32-S3 |
| `waveshare_esp32s3_ledarray` | Waveshare Matrix | ESP32-S3 |

### ODMR Quantum Firmware (2 variants)
| Board ID | Name | Chip |
|----------|------|------|
| `odmr-xiao-esp32s3` | ODMR ESP32-S3 | ESP32-S3 |
| `odmr-xiao-esp32c3` | ODMR ESP32-C3 | ESP32-C3 |

## Testing Locally

```bash
cd youseetoo.github
python -m http.server 9000

# Open browser
open http://localhost:9000/flasher.html
```

**Note**: When testing locally on `localhost:9000`, CORS restrictions apply:
- ✅ GitHub API calls work (has CORS headers)
- ✅ Loading manifests from GitHub works (has CORS headers)
- ✅ ESP Web Tools can flash from GitHub URLs

## Troubleshooting

### "Failed to download manifest"
1. Check if release exists: `https://github.com/youseetoo/uc2-esp32/releases`
2. Verify manifest asset in release
3. Check browser console for actual error
4. Confirm manifest is valid JSON

### "CORS policy" error
- Should NOT happen with this architecture
- If it does, check you're loading from GitHub releases, not raw.githubusercontent.com
- Verify `browser_download_url` is being used

### Version not appearing
- Check release is published (not draft)
- Verify tag follows `v*` pattern
- Check GitHub Actions workflow succeeded

## Benefits of This Architecture

✅ **Simple**: Single source of truth (GitHub Releases)  
✅ **Versioned**: Full history preserved automatically  
✅ **No CORS Issues**: GitHub has proper headers  
✅ **No Custom Hosting**: GitHub handles CDN/bandwidth  
✅ **Unified**: UC2 + ODMR firmware in one place  
✅ **Reliable**: GitHub's infrastructure  
✅ **Fast**: GitHub CDN worldwide  

## Links

- **Flasher**: https://youseetoo.github.io/flasher.html
- **Firmware Repo**: https://github.com/youseetoo/uc2-esp32
- **ODMR Source**: https://github.com/openUC2/TechnicalDocs-openUC2-QBox
- **Releases**: https://github.com/youseetoo/uc2-esp32/releases
- **ESP Web Tools**: https://esphome.github.io/esp-web-tools/
