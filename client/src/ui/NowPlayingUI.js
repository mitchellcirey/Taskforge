export class NowPlayingUI {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.textElement = null;
    this.fadeOutTimeout = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'now-playing-ui';
    
    // Create text element
    this.textElement = document.createElement('div');
    this.textElement.id = 'now-playing-text';
    this.textElement.textContent = '';
    
    this.element.appendChild(this.textElement);

    // Add styles (only once)
    if (!document.getElementById('now-playing-ui-styles')) {
      const style = document.createElement('style');
      style.id = 'now-playing-ui-styles';
      style.textContent = `
        #now-playing-ui {
          position: fixed;
          bottom: 70px;
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
        }
        #now-playing-ui.visible {
          opacity: 1;
        }
        #now-playing-text {
          line-height: 1.2;
        }
      `;
      document.head.appendChild(style);
    }

    if (!this.container.contains(this.element)) {
      this.container.appendChild(this.element);
    }
  }

  showTrack(trackName) {
    // Clear any existing fade-out timeout
    if (this.fadeOutTimeout) {
      clearTimeout(this.fadeOutTimeout);
      this.fadeOutTimeout = null;
    }

    // Format track name: convert underscores to spaces and capitalize words
    const formattedName = this.formatTrackName(trackName);
    this.textElement.textContent = `Now Playing: ${formattedName}`;

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

