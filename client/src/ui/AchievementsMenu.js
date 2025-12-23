import { getAchievementRegistry } from '../game/AchievementRegistry.js';

export class AchievementsMenu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onCloseCallback = null;
    this.achievementRegistry = getAchievementRegistry();
    this.currentLevel = 1; // Default to Level 1
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'achievements-menu';
    
    // Build tabs HTML
    const tabsHTML = `
      <div class="achievements-tabs">
        <button class="achievement-tab ${this.currentLevel === 1 ? 'active' : ''}" data-level="1">Level 1</button>
        <button class="achievement-tab ${this.currentLevel === 2 ? 'active' : ''}" data-level="2">Level 2</button>
        <button class="achievement-tab ${this.currentLevel === 3 ? 'active' : ''}" data-level="3">Level 3</button>
      </div>
    `;

    // Build achievement tree HTML for current level
    const achievementsHTML = this.buildAchievementsHTML(this.currentLevel);

    this.element.innerHTML = `
      <div class="achievements-background"></div>
      <div class="achievements-content">
        <h2 class="achievements-title">Achievements</h2>
        ${tabsHTML}
        <div class="achievements-tree" id="achievements-tree">
          ${achievementsHTML}
        </div>
        <div class="achievements-buttons">
          <button class="achievements-button" id="close-achievements-button">Close</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #achievements-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 5000;
        backdrop-filter: blur(8px);
        overflow-y: auto;
      }

      #achievements-menu.visible {
        display: flex;
      }

      .achievements-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #87CEEB 100%);
        background-size: 100% 200%;
        animation: skyShift 20s ease infinite;
        opacity: 0.85;
      }

      @keyframes skyShift {
        0%, 100% { background-position: 0% 0%; }
        50% { background-position: 0% 100%; }
      }

      .achievements-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 50px 60px;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        min-width: 500px;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        animation: fadeInScale 0.3s ease-out;
        margin: 20px;
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .achievements-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 30px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .achievements-tabs {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 30px;
        border-bottom: 2px solid rgba(52, 73, 94, 0.2);
        padding-bottom: 10px;
      }

      .achievement-tab {
        background: rgba(255, 255, 255, 0.7);
        border: 2px solid #34495e;
        border-radius: 8px 8px 0 0;
        color: #2c3e50;
        font-size: 18px;
        padding: 12px 30px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        bottom: -2px;
      }

      .achievement-tab:hover {
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-2px);
      }

      .achievement-tab.active {
        background: rgba(111, 214, 255, 0.2);
        border-color: #6FD6FF;
        border-bottom-color: transparent;
        color: #2c3e50;
        box-shadow: 0 -4px 12px rgba(111, 214, 255, 0.3);
      }

      .achievement-tab.active:hover {
        background: rgba(111, 214, 255, 0.3);
      }

      .achievements-tree {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
        margin-bottom: 30px;
      }

      .achievement-node {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px 30px;
        background: rgba(255, 255, 255, 0.9);
        border: 3px solid #34495e;
        border-radius: 12px;
        min-width: 400px;
        max-width: 600px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        position: relative;
      }

      .achievement-node.unlocked {
        background: rgba(111, 214, 255, 0.15);
        border-color: #6FD6FF;
        box-shadow: 0 4px 16px rgba(111, 214, 255, 0.3);
      }

      .achievement-node.locked {
        opacity: 0.5;
        filter: grayscale(0.7);
        background: rgba(200, 200, 200, 0.5);
      }

      .achievement-node.unlocked:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(111, 214, 255, 0.4);
      }

      .achievement-icon {
        font-size: 32px;
        min-width: 40px;
        text-align: center;
        flex-shrink: 0;
      }

      .achievement-node.unlocked .achievement-icon {
        color: #6FD6FF;
        text-shadow: 0 0 8px rgba(111, 214, 255, 0.5);
      }

      .achievement-content {
        flex: 1;
        text-align: left;
      }

      .achievement-name {
        color: #1a1a1a;
        font-size: 24px;
        margin: 0 0 8px 0;
        font-family: 'Arial', sans-serif;
        font-weight: bold;
      }

      .achievement-node.unlocked .achievement-name {
        color: #2c3e50;
      }

      .achievement-description {
        color: #555;
        font-size: 16px;
        margin: 0 0 8px 0;
        font-family: 'Arial', sans-serif;
        line-height: 1.4;
      }

      .achievement-prereq {
        color: #888;
        font-size: 14px;
        margin: 8px 0 0 0;
        font-family: 'Arial', sans-serif;
        font-style: italic;
      }

      .achievement-connector {
        width: 4px;
        height: 40px;
        background: linear-gradient(180deg, #6FD6FF 0%, rgba(111, 214, 255, 0.3) 100%);
        margin: 10px 0;
        border-radius: 2px;
        position: relative;
      }

      .achievement-connector::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: #6FD6FF;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(111, 214, 255, 0.6);
      }

      .achievements-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 40px;
      }

      .achievements-button {
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 8px;
        color: #1a1a1a;
        font-size: 18px;
        padding: 12px 40px;
        min-width: 150px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .achievements-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .achievements-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .no-achievements {
        color: #888;
        font-size: 18px;
        font-family: 'Arial', sans-serif;
        font-style: italic;
        padding: 40px 20px;
        text-align: center;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .achievements-content {
          min-width: 90%;
          padding: 30px 20px;
        }

        .achievement-node {
          min-width: 100%;
          padding: 15px 20px;
        }

        .achievements-title {
          font-size: 32px;
        }

        .achievements-tabs {
          flex-wrap: wrap;
          gap: 8px;
        }

        .achievement-tab {
          font-size: 16px;
          padding: 10px 20px;
        }
      }
    `;
    document.head.appendChild(style);

    this.setupEventListeners();
    this.setupKeyboardListener();
  }

  setupKeyboardListener() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element.classList.contains('visible')) {
        this.hide();
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      }
    });
  }

  setupEventListeners() {
    const closeButton = this.element.querySelector('#close-achievements-button');

    closeButton.addEventListener('click', () => {
      this.hide();
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    });

    // Setup tab click listeners
    const tabs = this.element.querySelectorAll('.achievement-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const level = parseInt(tab.getAttribute('data-level'));
        this.switchLevel(level);
      });
    });
  }

  buildAchievementsHTML(level) {
    // Get achievements for the specified level in dependency order
    const achievements = this.achievementRegistry.getAllInOrder(level);
    
    if (achievements.length === 0) {
      return '<div class="no-achievements">No achievements available for this level yet.</div>';
    }
    
    // Build achievement nodes HTML
    let achievementsHTML = '';
    achievements.forEach((achievement, index) => {
      const isLocked = !this.isUnlocked(achievement);
      const hasPrerequisites = achievement.prerequisites && achievement.prerequisites.length > 0;
      
      achievementsHTML += `
        <div class="achievement-node ${isLocked ? 'locked' : 'unlocked'}" data-achievement-id="${achievement.id}">
          <div class="achievement-icon">
            ${isLocked ? '🔒' : '✓'}
          </div>
          <div class="achievement-content">
            <h3 class="achievement-name">${achievement.name}</h3>
            <p class="achievement-description">${achievement.description}</p>
            ${hasPrerequisites ? `<div class="achievement-prereq">Requires: ${this.getPrerequisiteNames(achievement)}</div>` : ''}
          </div>
        </div>
        ${index < achievements.length - 1 ? '<div class="achievement-connector"></div>' : ''}
      `;
    });
    
    return achievementsHTML;
  }

  switchLevel(level) {
    if (level === this.currentLevel) {
      return; // Already on this level
    }
    
    this.currentLevel = level;
    
    // Update active tab
    const tabs = this.element.querySelectorAll('.achievement-tab');
    tabs.forEach(tab => {
      const tabLevel = parseInt(tab.getAttribute('data-level'));
      if (tabLevel === level) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update achievements tree
    const treeContainer = this.element.querySelector('#achievements-tree');
    treeContainer.innerHTML = this.buildAchievementsHTML(level);
  }

  isUnlocked(achievement) {
    // For now, all achievements are considered locked (display-only)
    // In the future, this will check actual unlock status
    // For the first achievement, we could consider it "available" (not locked)
    if (achievement.prerequisites && achievement.prerequisites.length === 0) {
      return false; // First achievement is also locked for now
    }
    return false;
  }

  getPrerequisiteNames(achievement) {
    if (!achievement.prerequisites || achievement.prerequisites.length === 0) {
      return '';
    }
    return achievement.prerequisites
      .map(id => {
        const prereq = this.achievementRegistry.get(id);
        return prereq ? prereq.name : id;
      })
      .join(', ');
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    // Reset to Level 1 when showing
    this.currentLevel = 1;
    const tabs = this.element.querySelectorAll('.achievement-tab');
    tabs.forEach(tab => {
      const tabLevel = parseInt(tab.getAttribute('data-level'));
      if (tabLevel === 1) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    // Update achievements tree to show Level 1
    const treeContainer = this.element.querySelector('#achievements-tree');
    if (treeContainer) {
      treeContainer.innerHTML = this.buildAchievementsHTML(1);
    }
    this.element.classList.add('visible');
  }

  hide() {
    this.element.classList.remove('visible');
  }

  onClose(callback) {
    this.onCloseCallback = callback;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

