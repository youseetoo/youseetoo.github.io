# Firmware Manifest Storage

This directory contains firmware manifests and binaries for the UC2 Web Flasher.

## Structure

```
static/firmware/
├── latest/                    # Latest stable release
│   ├── board-id-manifest.json
│   └── board-id.bin
├── v1.9/                      # Version-specific release
│   ├── board-id-manifest.json
│   └── board-id.bin
└── v2026.01.15/              # Date-tagged release
    ├── board-id-manifest.json
    └── board-id.bin
```

## Why Local Storage?

GitHub Releases don't support CORS (Cross-Origin Resource Sharing), which prevents the ESP Web Tools component from loading manifests directly from GitHub. By hosting manifests on the same origin as the flasher website, we avoid CORS issues.

## Automatic Deployment

Manifests and binaries are automatically deployed here by the GitHub Actions workflow:
- **Source**: `youseetoo/uc2-esp32` repository
- **Workflow**: `.github/workflows/build-and-release.yaml`
- **Trigger**: Git tags (e.g., `v1.9`)

### Deployment Process

1. Build firmware for all board variants
2. Generate ESP Web Tools manifests
3. Create GitHub Release (for backup/documentation)
4. Deploy to this directory via `deploy-to-website` job

## Manifest Format

Each manifest follows the ESP Web Tools format:

```json
{
  "name": "Board Display Name",
  "version": "v1.9",
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

**Important**: The `path` in the manifest is relative to the manifest's location. This ensures the binary is loaded from the same directory.

## Manual Deployment

If you need to manually add firmware:

1. Build your firmware:
   ```bash
   cd uc2-ESP
   pio run -e your_board_env
   ```

2. Create manifest:
   ```bash
   # Use build-and-release.yaml as reference
   ```

3. Copy to appropriate directory:
   ```bash
   mkdir -p static/firmware/vX.Y.Z
   cp firmware.bin static/firmware/vX.Y.Z/board-id.bin
   cp manifest.json static/firmware/vX.Y.Z/board-id-manifest.json
   ```

4. Update `latest/` if this is the new stable release

## ODMR Firmware

ODMR (quantum spectroscopy) firmware from external repository:
- **Location**: `static/firmware_odmr/`
- **Source**: `openUC2/TechnicalDocs-openUC2-QBox`
- **Workflow**: `.github/workflows/build-odmr-external.yaml` (in uc2-esp32 repo)
- **Update**: Weekly automatic or manual dispatch

## Testing Locally

When developing the flasher:

```bash
cd youseetoo.github
python -m http.server 9000

# Access flasher
open http://localhost:9000/flasher.html
```

Manifests will be loaded from `http://localhost:9000/static/firmware/latest/board-id-manifest.json`

## Troubleshooting

### "Failed to download manifest"
- Check if manifest file exists in the expected location
- Verify manifest is valid JSON
- Check browser console for CORS errors
- Ensure paths in manifest are relative

### "Failed to load binary"
- Ensure `.bin` file exists alongside manifest
- Check `path` field in manifest matches binary filename
- Verify binary file is not corrupted

## Links

- ESP Web Tools: https://esphome.github.io/esp-web-tools/
- UC2 Firmware Repo: https://github.com/youseetoo/uc2-esp32
- Web Flasher: https://youseetoo.github.io/flasher.html
