# UC2 ESP Web Tools Configuration Extension

Diese Implementierung erweitert die ESP Web Tools um UC2-spezifische Konfigurationsoptionen direkt im Manifest.

## Funktionen

- **Post-Install Konfiguration**: Nach dem Flashen erscheint automatisch ein Konfigurationsdialog
- **Manifest-basierte Optionen**: Konfigurationsoptionen werden direkt im Manifest definiert
- **Button & Select Optionen**: Unterstützt einfache Buttons und Dropdown-Menüs
- **Serielle Kommunikation**: Sendet Befehle direkt an das geflashte Gerät

## Manifest Format

Erweiterte Manifeste können jetzt eine `uc2_config` Sektion enthalten:

```json
{
  "name": "UC2-ESP32",
  "version": "2023_01_UC2-WEMOS",
  "builds": [...],
  "uc2_config": [
    {
      "label": "Set CAN Address",
      "description": "Choose CAN bus address for this device",
      "command": "{\"task\":\"/can_act\",\"address\":{value}}",
      "type": "select",
      "options": [
        { "label": "Master (1)", "value": 1 },
        { "label": "X-Axis (11)", "value": 11 },
        { "label": "Y-Axis (12)", "value": 12 }
      ]
    },
    {
      "label": "Initialize Modules",
      "description": "Enable basic UC2 modules",
      "command": "{\"task\":\"/modules_set\", \"modules\" : {\"led\" : 1, \"motor\": 1}}",
      "type": "button"
    }
  ]
}
```

## Konfigurationsoptionen

### Button-Typ
- **label**: Angezeigter Text
- **description**: Optional - Beschreibung
- **command**: JSON-Befehl als String
- **type**: "button"

### Select-Typ
- **label**: Angezeigter Text
- **description**: Optional - Beschreibung
- **command**: JSON-Befehl mit {value} Platzhalter
- **type**: "select"
- **options**: Array von {label, value} Objekten

## Implementierung

1. **uc2-config-extension.js**: Hauptlogik für die Erweiterung
2. **Erweiterte Manifeste**: Manifeste mit uc2_config Sektion
3. **Bootstrap Modal**: Benutzerfreundliche Oberfläche
4. **SerialPort API**: Direkte Kommunikation mit dem Gerät

## Beispiel-Befehle

- CAN-Adresse setzen: `{"task":"/can_act","address":256}`
- Module initialisieren: `{"task":"/modules_set", "modules" : {"led" : 1, "motor": 1}}`
- Motorachse konfigurieren: `{"task":"/motor_act", "setaxis": {"steppers": [{"stepperid": 1, "stepperaxis": 2}]}}`
- System-Status abrufen: `{"task":"/state_get"}`

## Verwendung

1. Board auswählen
2. "Install" klicken
3. Nach erfolgreichem Flash erscheint automatisch der Konfigurationsdialog
4. Gewünschte Optionen auswählen und ausführen
5. "Test Connection" verwenden um die Verbindung zu prüfen