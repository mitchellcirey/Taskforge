export class NowPlayingUI {
  constructor(container, audioManager = null) {
    this.container = container;
    this.audioManager = audioManager;
    this.element = null;
    this.labelElement = null;
    this.trackNameElement = null;
    this.fadeOutTimeout = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'now-playing-ui';
    
    // Create label element for "Now Playing: "
    this.labelElement = document.createElement('span');
    this.labelElement.id = 'now-playing-label';
    this.labelElement.textContent = 'Now Playing: ';
    
    // Create track name element (will be highlighted in gold)
    this.trackNameElement = document.createElement('span');
    this.trackNameElement.id = 'now-playing-track';
    this.trackNameElement.textContent = '';
    
    this.element.appendChild(this.labelElement);
    this.element.appendChild(this.trackNameElement);

    // Add styles (only once)
    if (!document.getElementById('now-playing-ui-styles')) {
      const style = document.createElement('style');
      style.id = 'now-playing-ui-styles';
      style.textContent = `
        #now-playing-ui {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1001;
          color: #ffffff;
          font-family: Arial, sans-serif;
          font-size: 14px;
          opacity: 0;
          pointer-events: none;
          user-select: none;
          transition: opacity 0.3s ease-in-out;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.5);
          padding: 8px 12px;
          border-radius: 4px;
        }
        #now-playing-ui.visible {
          opacity: 1;
        }
        #now-playing-label {
          line-height: 1.2;
        }
        #now-playing-track {
          line-height: 1.2;
          color: #FFD700;
          font-weight: bold;
        }
      `;
      document.head.appendChild(style);
    }

    if (!this.container.contains(this.element)) {
      this.container.appendChild(this.element);
    }
  }

  showTrack(trackName) {
    // Check if music is muted - don't show UI if muted
    if (this.audioManager && this.audioManager.musicMuted) {
      return;
    }

    // Clear any existing fade-out timeout
    if (this.fadeOutTimeout) {
      clearTimeout(this.fadeOutTimeout);
      this.fadeOutTimeout = null;
    }

    // Format track name: convert underscores to spaces and capitalize words
    const formattedName = this.formatTrackName(trackName);
    this.trackNameElement.textContent = formattedName;

    // Show the element (fade in)
    this.element.classList.add('visible');

    // Auto-hide after 3 seconds (fade out)
    this.fadeOutTimeout = setTimeout(() => {
      this.element.classList.remove('visible');
      this.fadeOutTimeout = null;
    }, 3000);
  }

  formatTrackName(trackName) {
    // Convert underscores to spaces and capitalize each word
    return trackName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  hide() {
    // Clear timeout if it exists
    if (this.fadeOutTimeout) {
      clearTimeout(this.fadeOutTimeout);
      this.fadeOutTimeout = null;
    }
    // Hide immediately
    this.element.classList.remove('visible');
  }

  destroy() {
    if (this.fadeOutTimeout) {
      clearTimeout(this.fadeOutTimeout);
      this.fadeOutTimeout = null;
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

