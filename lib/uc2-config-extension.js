// UC2 ESP Web Tools Extension
// This script extends the ESP Web Tools functionality to support UC2-specific configuration options

class UC2ConfigExtension {
  constructor() {
    this.setupExtension();
  }

  setupExtension() {
    // Wait for ESP Web Tools to load
    document.addEventListener('DOMContentLoaded', () => {
      this.waitForESPWebTools();
    });
  }

  waitForESPWebTools() {
    // Check if ESP Web Tools is loaded
    const checkInterval = setInterval(() => {
      const installButton = document.querySelector('esp-web-install-button');
      if (installButton) {
        clearInterval(checkInterval);
        this.initializeUC2Config(installButton);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }

  initializeUC2Config(installButton) {
    // Listen for install completion
    installButton.addEventListener('install-finished', (event) => {
      if (event.detail && event.detail.success) {
        this.showUC2ConfigDialog(event.detail);
      }
    });

    // Monkey patch the install dialog to add UC2 config option
    this.addUC2ConfigToDialog();
  }

  addUC2ConfigToDialog() {
    // This is a simplified approach - we'll inject UC2 config after installation
    console.log('UC2 Config Extension: Ready to enhance ESP Web Tools');
  }

  async showUC2ConfigDialog(installDetails) {
    try {
      // Get the manifest to check for UC2 config
      const manifestResponse = await fetch(installDetails.manifestPath || './static/firmware_build/esp32-uc2-wemos-manifest.json');
      const manifest = await manifestResponse.json();

      if (manifest.uc2_config && manifest.uc2_config.length > 0) {
        this.createUC2ConfigModal(manifest.uc2_config, installDetails.port);
      }
    } catch (error) {
      console.error('Error loading UC2 config:', error);
    }
  }

  createUC2ConfigModal(config, port) {
    // Create modal HTML
    const modalHTML = `
      <div id="uc2-config-modal" class="modal fade" tabindex="-1" aria-labelledby="uc2ConfigModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="uc2ConfigModalLabel">🔧 UC2 Device Configuration</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted">Configure your UC2 device with the options below:</p>
              <div id="uc2-config-options">
                ${this.generateConfigOptions(config)}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" onclick="window.uc2Config.testConnection()">Test Connection</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('uc2-config-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Store port reference
    this.port = port;
    window.uc2Config = this;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('uc2-config-modal'));
    modal.show();

    // Add event listeners for config options
    this.attachConfigEventListeners(config);
  }

  generateConfigOptions(config) {
    return config.map((option, index) => {
      if (option.type === 'button') {
        return `
          <div class="mb-3">
            <h6>${option.label}</h6>
            ${option.description ? `<p class="text-muted small">${option.description}</p>` : ''}
            <button class="btn btn-outline-primary" data-uc2-command="${option.command}" data-index="${index}">
              Execute
            </button>
          </div>
        `;
      } else if (option.type === 'select' && option.options) {
        const selectOptions = option.options.map(opt => 
          `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        
        return `
          <div class="mb-3">
            <h6>${option.label}</h6>
            ${option.description ? `<p class="text-muted small">${option.description}</p>` : ''}
            <div class="input-group">
              <select class="form-select" data-uc2-select-command="${option.command}" data-index="${index}">
                ${selectOptions}
              </select>
              <button class="btn btn-outline-primary" onclick="window.uc2Config.executeSelectCommand(${index})">
                Apply
              </button>
            </div>
          </div>
        `;
      }
      return '';
    }).join('');
  }

  attachConfigEventListeners(config) {
    // Button commands
    document.querySelectorAll('[data-uc2-command]').forEach(button => {
      button.addEventListener('click', (e) => {
        const command = e.target.getAttribute('data-uc2-command');
        this.executeCommand(command);
      });
    });
  }

  async executeCommand(command) {
    try {
      if (!this.port || !this.port.writable) {
        this.showAlert('Device not connected. Please ensure the device is connected.', 'warning');
        return;
      }

      const writer = this.port.writable.getWriter();
      const encoder = new TextEncoder();
      
      console.log(`Sending UC2 command: ${command}`);
      await writer.write(encoder.encode(command + '\n'));
      writer.releaseLock();
      
      this.showAlert(`Command sent successfully: ${command}`, 'success');
      
    } catch (error) {
      console.error('Error sending UC2 command:', error);
      this.showAlert(`Error sending command: ${error.message}`, 'danger');
    }
  }

  executeSelectCommand(index) {
    const select = document.querySelector(`[data-index="${index}"][data-uc2-select-command]`);
    if (select) {
      const commandTemplate = select.getAttribute('data-uc2-select-command');
      const selectedValue = select.value;
      const command = commandTemplate.replace('{value}', selectedValue);
      this.executeCommand(command);
    }
  }

  async testConnection() {
    await this.executeCommand('{"task":"/state_get"}');
  }

  showAlert(message, type = 'info') {
    // Create alert element
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    // Insert at top of modal body
    const modalBody = document.querySelector('#uc2-config-modal .modal-body');
    if (modalBody) {
      modalBody.insertAdjacentHTML('afterbegin', alertHTML);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        const alert = modalBody.querySelector('.alert');
        if (alert) {
          alert.remove();
        }
      }, 5000);
    }
  }
}

// Initialize the extension
new UC2ConfigExtension();