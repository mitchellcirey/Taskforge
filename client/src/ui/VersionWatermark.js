// Import version at build time
import versionData from '../../../version.json';

export class VersionWatermark {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.seedElement = null;
    this.versionElement = null;
    this.version = versionData.version || '0.0.0';
    this.create();
    // Update periodically to check for seed changes and streamer mode
    this.updateInterval = setInterval(() => this.update(), 1000);
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'version-watermark';
    
    // Create seed element
    this.seedElement = document.createElement('div');
    this.seedElement.id = 'version-watermark-seed';
    this.seedElement.className = 'version-watermark-line';
    
    // Create version element
    this.versionElement = document.createElement('div');
    this.versionElement.id = 'version-watermark-version';
    this.versionElement.className = 'version-watermark-line';
    this.versionElement.textContent = `Taskforge v${this.version}`;
    
    this.element.appendChild(this.seedElement);
    this.element.appendChild(this.versionElement);

    // Add styles (only once)
    if (!document.getElementById('version-watermark-styles')) {
      const style = document.createElement('style');
      style.id = 'version-watermark-styles';
      style.textContent = `
        #version-watermark {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          color: #ffffff;
          font-family: Arial, sans-serif;
          font-size: 14px;
          opacity: 0.5;
          pointer-events: none;
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .version-watermark-line {
          line-height: 1.2;
        }
      `;
      document.head.appendChild(style);
    }

    if (!this.container.contains(this.element)) {
      this.container.appendChild(this.element);
    }
    
    // Initial update
    this.update();
  }

  getStreamerMode() {
    try {
      const streamerMode = localStorage.getItem('taskforge_streamerMode');
      return streamerMode === 'true';
    } catch (error) {
      return false;
    }
  }

  getCurrentSeed() {
    // Try to get seed from gameInstance
    if (window.gameInstance && typeof window.gameInstance.currentWorldSeed === 'number') {
      return window.gameInstance.currentWorldSeed;
    }
    // Try to get seed from sceneManager's tileGrid
    if (window.gameInstance && window.gameInstance.sceneManager && 
        window.gameInstance.sceneManager.tileGrid &&
        typeof window.gameInstance.sceneManager.tileGrid.seed === 'number') {
      return window.gameInstance.sceneManager.tileGrid.seed;
    }
    return null;
  }

  update() {
    if (!this.seedElement || !this.versionElement) {
      return;
    }
    
    const seed = this.getCurrentSeed();
    const streamerMode = this.getStreamerMode();
    
    if (seed !== null && !streamerMode) {
      // Show seed
      this.seedElement.textContent = `Seed: ${seed}`;
      this.seedElement.style.display = 'block';
    } else {
      // Hide seed (either no seed or streamer mode enabled)
      this.seedElement.style.display = 'none';
    }
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

}
