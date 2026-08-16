// Noir Main UI Controller
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

  // Icon map helpers
  function getDeviceIcon(type) {
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

  function getAppIcon(name) {
    const lower = name.toLowerCase();
    if (lower.includes('spotify')) return '🟢';
    if (lower.includes('valorant') || lower.includes('game')) return '🎯';
    if (lower.includes('chrome') || lower.includes('browser')) return '🌐';
    if (lower.includes('discord')) return '💬';
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

  // 1. Render Devices
  function renderDevices() {
    devicesGrid.innerHTML = '';
    devicesCount.textContent = `${devices.length} active`;

    devices.forEach((dev) => {
      const card = document.createElement('div');
      card.className = `device-card ${dev.isDefault ? 'active' : ''}`;
      card.id = `device-${dev.id}`;

      // Count apps routed to this device
      const routedCount = sessions.filter((s) => s.deviceId === dev.id).length;

      card.innerHTML = `
        <div class="device-card-header">
          <div class="device-icon-wrap">
            <span>${getDeviceIcon(dev.type)}</span>
          </div>
          <span class="status-dot ${dev.isActive ? 'online' : ''}" title="${dev.isActive ? 'Connected' : 'Offline'}"></span>
        </div>
        <div class="device-name" title="${dev.name}">${dev.displayName || dev.name}</div>
        <div class="device-sub">
          <span>${dev.isDefault ? 'Default' : (dev.type.toUpperCase())}</span>
          <span class="device-app-count">${routedCount} app${routedCount !== 1 ? 's' : ''}</span>
        </div>
      `;

      devicesGrid.appendChild(card);
    });
  }

  // 2. Render Apps
  function renderApps() {
    appsList.innerHTML = '';
    appsCount.textContent = `${sessions.length} sessions`;

    if (sessions.length === 0) {
      appsList.innerHTML = `
        <div style="text-align: center; padding: 40px var(--space-md); color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🎵</div>
          <div style="font-size: 13px; font-weight: 500; color: var(--text-secondary);">No Active Audio Sessions</div>
          <div style="font-size: 11px; margin-top: 4px;">Play music or launch a game to route audio</div>
        </div>
      `;
      return;
    }

    sessions.forEach((session) => {
      const card = document.createElement('div');
      card.className = 'app-card';
      card.id = `session-${session.id}`;

      const currentDev = devices.find((d) => d.id === session.deviceId) || devices[0];
      const volPercent = Math.round(session.volume * 100);

      card.innerHTML = `
        <div class="app-card-top">
          <div class="app-meta">
            <div class="app-icon">${getAppIcon(session.displayName)}</div>
            <div class="app-details">
              <span class="app-name">${session.displayName}</span>
              <span class="app-process">${session.processName}</span>
            </div>
          </div>
          <div class="route-selector">
            <button class="route-dropdown-btn" id="btn-route-${session.id}">
              <span class="route-label">${getDeviceIcon(currentDev.type)} ${currentDev.displayName || currentDev.name}</span>
              <span class="route-arrow">▼</span>
            </button>
            <div class="dropdown-menu" id="menu-route-${session.id}">
              ${devices.map((d) => `
                <button class="dropdown-item ${d.id === session.deviceId ? 'selected' : ''}" data-dev-id="${d.id}">
                  <span>${getDeviceIcon(d.type)} ${d.displayName || d.name}</span>
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
            <button class="mute-btn ${session.isMuted ? 'muted' : ''}" id="mute-${session.id}" title="${session.isMuted ? 'Unmute' : 'Mute'}">
              ${session.isMuted ? '🔇' : '🔊'}
            </button>
            <div class="slider-container">
              <input type="range" class="volume-slider" id="slider-${session.id}" min="0" max="100" value="${session.isMuted ? 0 : volPercent}">
            </div>
            <span class="volume-percentage" id="vol-text-${session.id}">${session.isMuted ? '0%' : `${volPercent}%`}</span>
          </div>
        </div>
      `;

      appsList.appendChild(card);

      // Register real-time visualizer meter
      const meterEl = document.getElementById(`meter-${session.id}`);
      if (window.Visualizer) {
        window.Visualizer.registerMeter(session.id, meterEl, session.peakLevel || 0.5);
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
            if (window.Toast) {
              window.Toast.show(`Routed ${session.displayName} → ${targetDev.displayName || targetDev.name}`, 'success');
            }
            renderAll();
          }
        });
      });

      // Wire Volume Slider
      const slider = document.getElementById(`slider-${session.id}`);
      const volText = document.getElementById(`vol-text-${session.id}`);
      const muteBtn = document.getElementById(`mute-${session.id}`);

      slider.addEventListener('input', async (e) => {
        const val = parseInt(e.target.value, 10);
        volText.textContent = `${val}%`;
        session.volume = val / 100;

        if (session.isMuted && val > 0) {
          session.isMuted = false;
          muteBtn.classList.remove('muted');
          muteBtn.innerHTML = '🔊';
          if (window.Visualizer) window.Visualizer.setMute(session.id, false);
        }

        if (window.electronAPI) {
          await window.electronAPI.setVolume(session.id, session.volume);
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

  // Start initialization
  await loadData();
});
