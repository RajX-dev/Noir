// Noir Notification Toast Module
// Ref: docs/visuals.md

const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ'
    };

    const iconColorMap = {
      success: 'var(--status-active)',
      warning: 'var(--status-warning)',
      error: 'var(--status-error)',
      info: 'var(--accent-secondary)'
    };

    toast.innerHTML = `
      <span class="toast-icon" style="color: ${iconColorMap[type] || 'var(--text-accent)'}; font-weight: bold;">
        ${iconMap[type] || '•'}
      </span>
      <span class="toast-text">${message}</span>
    `;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, duration);
  }
};

window.Toast = Toast;
