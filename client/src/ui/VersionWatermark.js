// Import version at build time
import versionData from '../../../version.json';

export class VersionWatermark {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.version = versionData.version || '0.0.0';
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'version-watermark';
    this.element.textContent = `Taskforge v${this.version}`;

    // Add styles
    const style = document.createElement('style');
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
      }
    `;
    document.head.appendChild(style);

    if (!this.container.contains(this.element)) {
      this.container.appendChild(this.element);
    }
  }

}
