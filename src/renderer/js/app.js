// Noir Main UI Controller — Phase 3
// Ref: docs/architecture.md, docs/visuals.md

document.addEventListener('DOMContentLoaded', async () => {
  // State
  let devices = [];
  let sessions = [];
  let profiles = [];
  let activeDropdown = null;

  // DOM Elements
  const devicesGrid = document.getElementById('devices-grid');
  const devicesCount = document.getElementById('devices-count');
  const appsList = document.getElementById('apps-list');
  const appsCount = document.getElementById('apps-count');
  const profilesRow = document.getElementById('profiles-row');

  // Window Controls
  const btnMin = document.getElementById('btn-minimize');
  const btnMax = document.getElementById('btn-maximize');
  const btnClose = document.getElementById('btn-close');

  if (window.electronAPI) {
    btnMin.addEventListener('click', () => window.electronAPI.minimizeWindow());
    btnMax.addEventListener('click', () => window.electronAPI.maximizeWindow());
    btnClose.addEventListener('click', () => window.electronAPI.closeWindow());
  }

  // Profile Modal Elements
  const modalNewProfile = document.getElementById('modal-new-profile');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const modalSave = document.getElementById('modal-save');
  const profileNameInput = document.getElementById('profile-name-input');
  const profileIconInput = document.getElementById('profile-icon-input');

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (activeDropdown && !e.target.closest('.route-selector')) {
      activeDropdown.classList.remove('show');
      activeDropdown = null;
    }
  });

  // SVG Device Icon helper
  function getDeviceIconSvg(type) {
    switch (type) {
      case 'headphones':
        return '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12v7c0 1.66 1.34 3 3 3h2v-8H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-3v8h2c1.66 0 3-1.34 3-3v-7c0-5.52-4.48-10-10-10z"/></svg>';
      case 'bluetooth':
        return '<svg viewBox="0 0 24 24"><path d="M14.79 10.62L12 7.83V16.17l2.79-2.79 4.59 4.59L12 24V0l7.38 5.97-4.59 4.65zm-2.79-4.8L10.21 4.03l-4.6 4.59 6.39 6.38V5.82zm0 12.36V13.8L5.61 19.38l4.59 4.59 1.8-1.79z"/></svg>';
      case 'hdmi':
        return '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>';
      case 'usb':
        return '<svg viewBox="0 0 24 24"><path d="M15 7v4h1v2h-3V5h2l-3-4-3 4h2v8H8v-2.07c.6-.37 1-.98 1-1.68 0-1.1-.9-2-2-2s-2 .9-2 2c0 .7.4 1.31 1 1.68V13c0 1.1.9 2 2 2h3v5.05c-.6.37-1 .98-1 1.68 0 1.1.9 2 2 2s2-.9 2-2c0-.7-.4-1.31-1-1.68V15h3c1.1 0 2-.9 2-2v-2h1V7h-4z"/></svg>';
      case 'speakers':
      default:
        return '<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 3.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>';
    }
  }

  function getDeviceEmoji(type) {
    switch (type) {
      case 'headphones': return '🎧';
      case 'bluetooth': return '📡';
      case 'hdmi': return '🖥️';
      case 'usb': return '🔌';
      case 'speakers':
      default:
        return '🔊';
    }
  }

  function getAppIcon(name = '', processName = '') {
    const combined = `${name} ${processName}`.toLowerCase();
    if (combined.includes('spotify')) return '🟢';
    if (combined.includes('call of duty') || combined.includes('cod') || combined.includes('valorant') || combined.includes('steam')) return '🎯';
    if (combined.includes('zen') || combined.includes('chrome') || combined.includes('edge') || combined.includes('firefox') || combined.includes('brave')) return '🌐';
    if (combined.includes('discord')) return '💬';
    if (combined.includes('antigravity') || combined.includes('code') || combined.includes('devenv')) return '⚡';
    if (combined.includes('vlc') || combined.includes('media') || combined.includes('netflix') || combined.includes('prime')) return '🎬';
    return '🎵';
  }

  // Initial Load
  async function loadData() {
    try {
      if (window.electronAPI) {
        devices = await window.electronAPI.getDevices();
        sessions = await window.electronAPI.getSessions();
        profiles = await window.electronAPI.getProfiles();
      }
      renderAll();
    } catch (err) {
      console.error('Failed to load initial data:', err);
      if (window.Toast) {
        window.Toast.show('Failed to connect to audio subsystem', 'error');
      }
    }
  }

  function renderAll() {
    renderDevices();
    renderApps();
    renderProfiles();
  }

  // 1. Render Devices (with Drag-and-Drop Drop Target handlers)
  function renderDevices() {
    devicesGrid.innerHTML = '';
    devicesCount.textContent = `${devices.length} active`;

    devices.forEach((dev) => {
      const card = document.createElement('div');
      card.className = `device-card ${dev.isDefault ? 'active' : ''}`;
      card.id = `device-${dev.id}`;
      card.setAttribute('data-device-id', dev.id);
      card.setAttribute('tabindex', '0');

      // Count apps routed to this device
      const routedCount = sessions.filter((s) => s.deviceId === dev.id).length;

      card.innerHTML = `
        <div class="device-card-header">
          <div class="device-icon-wrap">
            ${getDeviceIconSvg(dev.type)}
          </div>
          <span class="status-dot ${dev.isActive ? 'online' : ''}" title="${dev.isActive ? 'Connected' : 'Offline'}"></span>
        </div>
        <div class="device-name" title="${dev.name}">${dev.displayName || dev.name}</div>
        <div class="device-sub">
          <span>${dev.isDefault ? 'Default' : (dev.type.toUpperCase())}</span>
          <span class="device-app-count">${routedCount} app${routedCount !== 1 ? 's' : ''}</span>
        </div>
      `;

      // Drag and Drop Listeners for Device Card Target
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', (e) => {
        // Prevent premature removal when hovering child elements
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('drag-over');
        }
      });

      card.addEventListener('drop', async (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const sessionId = e.dataTransfer.getData('text/plain');

        if (!sessionId) return;

        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return;

        if (session.deviceId !== dev.id) {
          session.deviceId = dev.id;
          if (window.electronAPI) {
            await window.electronAPI.routeSession(session.id, dev.id);
          }

          // Trigger drop pulse animation
          card.classList.add('drop-pulse');
          setTimeout(() => card.classList.remove('drop-pulse'), 500);

          if (window.Toast) {
            window.Toast.show(`Routed ${session.displayName} ➔ ${dev.displayName || dev.name}`, 'success');
          }

          renderAll();
        }
      });

      devicesGrid.appendChild(card);
    });
  }

  // 2. Render Apps (with Draggable Support & Interactive Sliders)
  function renderApps() {
    appsList.innerHTML = '';
    appsCount.textContent = `${sessions.length} sessions`;

    if (sessions.length === 0) {
      appsList.innerHTML = `
        <div style="text-align: center; padding: 40px var(--space-md); color: var(--text-muted); animation: card-enter 300ms var(--ease-spring);">
          <div style="font-size: 32px; margin-bottom: 8px;">🎵</div>
          <div style="font-size: 13px; font-weight: 500; color: var(--text-secondary);">No Active Audio Sessions</div>
          <div style="font-size: 11px; margin-top: 4px;">Play music, video, or a game to route audio</div>
        </div>
      `;
      return;
    }

    sessions.forEach((session) => {
      const card = document.createElement('div');
      card.className = 'app-card card-enter';
      card.id = `session-${session.id}`;
      card.setAttribute('draggable', 'true');
      card.setAttribute('tabindex', '0');

      const currentDev = devices.find((d) => d.id === session.deviceId) || devices.find((d) => d.isDefault) || devices[0] || { name: 'Default Device', type: 'speakers' };
      const volPercent = Math.round(session.volume * 100);

      card.innerHTML = `
        <div class="app-card-top">
          <div class="app-meta">
            <div class="app-icon">${getAppIcon(session.displayName, session.processName)}</div>
            <div class="app-details">
              <span class="app-name">${session.displayName}</span>
              <span class="app-process">${session.processName}</span>
            </div>
          </div>
          <div class="route-selector">
            <button class="route-dropdown-btn" id="btn-route-${session.id}" aria-label="Select output device">
              <span class="route-label">${getDeviceEmoji(currentDev.type)} ${currentDev.displayName || currentDev.name}</span>
              <span class="route-arrow">▼</span>
            </button>
            <div class="dropdown-menu" id="menu-route-${session.id}">
              ${devices.map((d) => `
                <button class="dropdown-item ${d.id === session.deviceId ? 'selected' : ''}" data-dev-id="${d.id}">
                  <span>${getDeviceEmoji(d.type)} ${d.displayName || d.name}</span>
                  ${d.id === session.deviceId ? '<span>✓</span>' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="app-card-bottom">
          <div class="meter-container">
            <div class="meter-bar" id="meter-${session.id}"></div>
          </div>
          <div class="volume-control-row">
            <button class="mute-btn ${session.isMuted ? 'muted' : ''}" id="mute-${session.id}" title="${session.isMuted ? 'Unmute' : 'Mute'}" aria-label="Toggle mute">
              ${session.isMuted ? '🔇' : '🔊'}
            </button>
            <div class="slider-container">
              <input type="range" class="volume-slider" id="slider-${session.id}" min="0" max="100" value="${session.isMuted ? 0 : volPercent}" aria-label="Volume level">
            </div>
            <span class="volume-percentage" id="vol-text-${session.id}">${session.isMuted ? '0%' : `${volPercent}%`}</span>
          </div>
        </div>
      `;

      appsList.appendChild(card);

      // Drag and Drop Listeners for App Card
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', session.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.device-card').forEach((d) => d.classList.remove('drag-over'));
      });

      // Register real-time visualizer meter with volume coupling
      const meterEl = document.getElementById(`meter-${session.id}`);
      if (window.Visualizer) {
        window.Visualizer.registerMeter(session.id, meterEl, session.peakLevel || 0.6, session.isMuted ? 0 : session.volume);
      }

      // Wire Dropdown
      const routeBtn = document.getElementById(`btn-route-${session.id}`);
      const menu = document.getElementById(`menu-route-${session.id}`);

      routeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeDropdown && activeDropdown !== menu) {
          activeDropdown.classList.remove('show');
        }
        menu.classList.toggle('show');
        activeDropdown = menu.classList.contains('show') ? menu : null;
      });

      menu.querySelectorAll('.dropdown-item').forEach((item) => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetDevId = item.getAttribute('data-dev-id');
          menu.classList.remove('show');
          activeDropdown = null;

          if (targetDevId !== session.deviceId) {
            session.deviceId = targetDevId;
            if (window.electronAPI) {
              await window.electronAPI.routeSession(session.id, targetDevId);
            }
            const targetDev = devices.find((d) => d.id === targetDevId);
            if (window.Toast && targetDev) {
              window.Toast.show(`Routed ${session.displayName} ➔ ${targetDev.displayName || targetDev.name}`, 'success');
            }
            renderAll();
          }
        });
      });

      // Wire Volume Slider
      const slider = document.getElementById(`slider-${session.id}`);
      const volText = document.getElementById(`vol-text-${session.id}`);
      const muteBtn = document.getElementById(`mute-${session.id}`);

      const updateVolumeUI = async (val) => {
        volText.textContent = `${val}%`;
        session.volume = val / 100;

        if (session.isMuted && val > 0) {
          session.isMuted = false;
          muteBtn.classList.remove('muted');
          muteBtn.innerHTML = '🔊';
          if (window.Visualizer) window.Visualizer.setMute(session.id, false);
        }

        if (window.Visualizer) {
          window.Visualizer.setVolume(session.id, session.volume);
        }

        if (window.electronAPI) {
          await window.electronAPI.setVolume(session.id, session.volume);
        }
      };

      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        updateVolumeUI(val);
      });

      // Keyboard arrow navigation on slider
      slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          const newVal = Math.min(100, parseInt(slider.value, 10) + 5);
          slider.value = newVal;
          updateVolumeUI(newVal);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          const newVal = Math.max(0, parseInt(slider.value, 10) - 5);
          slider.value = newVal;
          updateVolumeUI(newVal);
        }
      });

      // Wire Mute Button
      muteBtn.addEventListener('click', async () => {
        session.isMuted = !session.isMuted;
        muteBtn.classList.toggle('muted', session.isMuted);
        muteBtn.innerHTML = session.isMuted ? '🔇' : '🔊';

        slider.value = session.isMuted ? 0 : Math.round(session.volume * 100);
        volText.textContent = session.isMuted ? '0%' : `${Math.round(session.volume * 100)}%`;

        if (window.Visualizer) {
          window.Visualizer.setMute(session.id, session.isMuted);
        }

        if (window.electronAPI) {
          await window.electronAPI.muteSession(session.id, session.isMuted);
        }
      });
    });
  }

  // 3. Render Profiles
  function renderProfiles() {
    profilesRow.innerHTML = '';

    profiles.forEach((prof) => {
      const pill = document.createElement('button');
      pill.className = `profile-pill ${prof.isActive ? 'active' : ''}`;
      pill.id = `profile-${prof.id}`;
      pill.setAttribute('tabindex', '0');
      pill.innerHTML = `<span>${prof.icon || '🎛️'}</span> <span>${prof.name}</span>`;

      pill.addEventListener('click', async () => {
        if (!prof.isActive) {
          if (window.electronAPI) {
            const res = await window.electronAPI.applyProfile(prof.id);
            if (res && res.sessions) {
              sessions = res.sessions;
            }
          }
          profiles.forEach((p) => (p.isActive = p.id === prof.id));
          if (window.Toast) {
            window.Toast.show(`Profile applied: ${prof.name}`, 'success');
          }
          renderAll();
        }
      });

      profilesRow.appendChild(pill);
    });

    // "+ New" Profile button
    const addBtn = document.createElement('button');
    addBtn.className = 'profile-pill add-btn';
    addBtn.id = 'btn-add-profile';
    addBtn.setAttribute('tabindex', '0');
    addBtn.innerHTML = '<span>➕</span> <span>New Profile</span>';
    addBtn.addEventListener('click', () => {
      profileNameInput.value = '';
      modalNewProfile.classList.add('open');
      profileNameInput.focus();
    });

    profilesRow.appendChild(addBtn);
  }

  // Modal Handlers
  modalClose.addEventListener('click', () => modalNewProfile.classList.remove('open'));
  modalCancel.addEventListener('click', () => modalNewProfile.classList.remove('open'));

  modalSave.addEventListener('click', async () => {
    const name = profileNameInput.value.trim();
    const icon = profileIconInput.value.trim() || '🎛️';

    if (!name) {
      if (window.Toast) window.Toast.show('Please enter a profile name', 'warning');
      return;
    }

    modalNewProfile.classList.remove('open');

    if (window.electronAPI) {
      const res = await window.electronAPI.saveProfile({ name, icon });
      if (res && res.profiles) {
        profiles = res.profiles;
      }
    }

    if (window.Toast) {
      window.Toast.show(`Created & saved profile "${name}"`, 'success');
    }
    renderProfiles();
  });

  // Push Event Listeners from DeviceMonitor
  if (window.electronAPI) {
    window.electronAPI.onDevicesChanged((updatedDevices) => {
      devices = updatedDevices;
      renderDevices();
    });

    window.electronAPI.onSessionsChanged((updatedSessions) => {
      sessions = updatedSessions;
      renderApps();
      renderDevices();
    });
  }

  // Start initialization
  await loadData();
});
