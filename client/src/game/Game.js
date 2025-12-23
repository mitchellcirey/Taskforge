import { SceneManager } from './SceneManager.js';
import { LoadingScreen } from '../ui/LoadingScreen.js';
import { MainMenu } from '../ui/MainMenu.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { SettingsMenu } from '../ui/SettingsMenu.js';
import { MainMenuSettings } from '../ui/MainMenuSettings.js';
import { CreditsMenu } from '../ui/CreditsMenu.js';
import { AdminMenu } from '../ui/AdminMenu.js';
import { VersionWatermark } from '../ui/VersionWatermark.js';
import { SaveLoadDialog } from '../ui/SaveLoadDialog.js';
import { PlaySubmenu } from '../ui/PlaySubmenu.js';
import { GameState } from './GameState.js';
import { AudioManager } from './AudioManager.js';
import { WebSocketClient } from '../networking/WebSocketClient.js';
import { SaveManager } from './SaveManager.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.sceneManager = null;
    this.loadingScreen = null;
    this.mainMenu = null;
    this.pauseMenu = null;
    this.settingsMenu = null;
    this.mainMenuSettings = null;
    this.creditsMenu = null;
    this.adminMenu = null;
    this.versionWatermark = null;
    this.saveLoadDialog = null;
    this.playSubmenu = null;
    this.gameState = new GameState();
    this.audioManager = new AudioManager();
    this.wsClient = null; // WebSocket client for multiplayer
    this.saveManager = new SaveManager();
    this.isInitialized = false;
    this.lastTime = 0;
  }

  async init() {
    // Initialize audio manager
    this.audioManager.init();

    // Load audio files
    try {
      await this.audioManager.loadSound('main_menu', 'public/sounds/music/main_menu.mp3', true);
      
      // Load gameplay music tracks
      const gameplayTracks = [
        'bankside_breeze',
        'boots_on_the_path',
        'bread_oven_breeze',
        'brine_and_bells',
        'city_sleeps',
        'creaking_hull',
        'crooked_fiddle',
        'drifting_oars',
        'fields_at_dusk',
        'flute_and_feathers',
        'gullsong',
        'mug_and_melody',
        'old_magic',
        'quiet_tide',
        'rope_and_rum',
        'runes_in_rain',
        'tavern_table_tap',
        'welcome_back'
      ];

      for (const track of gameplayTracks) {
        try {
          await this.audioManager.loadSound(track, `public/sounds/music/${track}.mp3`, true);
        } catch (e) {
          console.warn(`Could not load track ${track}:`, e);
        }
      }

      this.audioManager.loadGameplayMusic(gameplayTracks);
    } catch (e) {
      console.warn('Some audio files could not be loaded:', e);
    }

    // Show loading screen
    this.loadingScreen = new LoadingScreen(this.container);
    this.loadingScreen.show();

    // Create main menu
    this.mainMenu = new MainMenu(this.container, this.gameState, this.audioManager);
    this.mainMenu.onPlay(() => {
      // Show play submenu
      if (this.playSubmenu) {
        this.mainMenu.hide();
        this.playSubmenu.show();
      }
    });
    this.mainMenu.onResumeLastSave(() => {
      this.resumeLastSave();
    });
    this.mainMenu.onAchievements(() => {
      // Placeholder for achievements
      console.log('Achievements clicked');
      // TODO: Implement achievements system
    });
    this.mainMenu.onSettings(() => {
      // Open main menu settings
      this.mainMenu.hide();
      if (this.mainMenuSettings) {
        this.mainMenuSettings.show();
      }
    });
    this.mainMenu.onCredits(() => {
      // Show credits menu and hide main menu
      this.mainMenu.hide();
      if (this.creditsMenu) {
        this.creditsMenu.show();
      }
    });
    this.mainMenu.show();

    // Create main menu settings
    this.mainMenuSettings = new MainMenuSettings(this.container);
    this.mainMenuSettings.onClose(() => {
      // Return to main menu when settings is closed
      if (this.gameState.getState() === GameState.MENU) {
        this.mainMenu.show();
      }
    });

    // Create credits menu
    this.creditsMenu = new CreditsMenu(this.container);
    this.creditsMenu.onClose(() => {
      // Return to main menu when credits is closed
      if (this.gameState.getState() === GameState.MENU) {
        this.mainMenu.show();
      }
    });

    // Create in-game settings menu (will be updated when game starts)
    this.settingsMenu = new SettingsMenu(this.container, null, this.audioManager);
    // Apply audio settings after sounds are loaded
    this.settingsMenu.applyAudioSettings();
    this.settingsMenu.onClose(() => {
      // Return to appropriate menu when settings is closed
      if (this.gameState.getState() === 'paused') {
        this.pauseMenu.show();
      }
    });

    // Create pause menu
    this.pauseMenu = new PauseMenu(this.container, this.gameState);
    this.pauseMenu.onResume(() => {
      this.gameState.setState(GameState.PLAYING);
    });
    this.pauseMenu.onQuitToMenu(() => {
      this.returnToMenu();
    });
    this.pauseMenu.onSettings(() => {
      if (this.settingsMenu) {
        this.settingsMenu.show();
      }
    });
    this.pauseMenu.onSaveWorld(() => {
      this.saveWorld();
    });

    // Create admin menu
    this.adminMenu = new AdminMenu(this.container);

    // Create save/load dialog
    this.saveLoadDialog = new SaveLoadDialog(this.container);
    this.saveLoadDialog.onLoad((filePath) => {
      this.loadWorld(filePath);
      this.saveLoadDialog.hide();
    });
    this.saveLoadDialog.onCancel(() => {
      // Show main menu again when cancel is clicked (or play submenu if that's where we came from)
      if (this.mainMenu && this.gameState.getState() === GameState.MENU) {
        this.mainMenu.show();
      }
    });

    // Create play submenu
    this.playSubmenu = new PlaySubmenu(this.container);
    this.playSubmenu.onNewGame(() => {
      this.startGame();
    });
    this.playSubmenu.onLoadGame(() => {
      this.showLoadDialog();
    });
    this.playSubmenu.onMultiplayer(() => {
      // Placeholder for multiplayer
      console.log('Multiplayer clicked');
      // TODO: Implement multiplayer functionality
    });
    this.playSubmenu.onBack(() => {
      // Return to main menu
      if (this.mainMenu) {
        this.mainMenu.show();
      }
    });

    // Create version watermark (always visible)
    this.versionWatermark = new VersionWatermark(this.container);

    // Set initial state
    this.gameState.setState(GameState.MENU);

    // Hide loading screen
    this.loadingScreen.hide();

    // Start game loop
    this.isInitialized = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  async startGame() {
    this.gameState.setState(GameState.LOADING);
    this.mainMenu.hide();

    // Initialize scene manager
    if (!this.sceneManager) {
      this.sceneManager = new SceneManager(this.container, this.audioManager);
      await this.sceneManager.init();
      
      // Update settings menu with tileGrid after scene manager is initialized
      if (this.sceneManager.tileGrid && this.settingsMenu) {
        this.settingsMenu.setTileGrid(this.sceneManager.tileGrid);
      }
    }

    this.gameState.setState(GameState.PLAYING);
    
    // Start gameplay music
    this.audioManager.playNextGameplayTrack();
  }

  captureScreenshot() {
    if (!this.sceneManager || !this.sceneManager.renderer || !this.sceneManager.scene || !this.sceneManager.camera) {
      return null;
    }

    try {
      // Force a render before capturing to ensure the scene is up to date
      this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
      
      // Use Three.js renderer to capture screenshot
      const canvas = this.sceneManager.renderer.domElement;
      if (!canvas) {
        return null;
      }

      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/png');
      return dataURL;
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  }

  async saveWorld() {
    if (!this.sceneManager) {
      console.error('Cannot save: SceneManager not initialized');
      return;
    }

    try {
      // Capture screenshot before saving
      const screenshotDataURL = this.captureScreenshot();
      
      // Serialize game state
      const saveData = this.saveManager.serialize(this.sceneManager, this.sceneManager.cameraController);
      
      // Save via Electron API (including screenshot)
      if (!window.electronAPI || !window.electronAPI.saveWorld) {
        console.error('Electron API not available');
        alert('Save functionality is not available. Please run the game in Electron.');
        return;
      }

      const result = await window.electronAPI.saveWorld(saveData, screenshotDataURL);
      
      if (result.success) {
        console.log('World saved successfully:', result.filePath);
        // Show success message (you could add a toast notification here)
        alert('World saved successfully!');
      } else {
        console.error('Failed to save world:', result.error);
        alert(`Failed to save world: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving world:', error);
      alert(`Error saving world: ${error.message}`);
    }
  }

  async resumeLastSave() {
    try {
      // Get most recent save file
      if (!window.electronAPI || !window.electronAPI.listSaveFiles) {
        console.error('Electron API not available');
        alert('Resume functionality is not available. Please run the game in Electron.');
        return;
      }

      const saveFiles = await window.electronAPI.listSaveFiles();
      if (saveFiles.length === 0) {
        alert('No save files found.');
        return;
      }

      // Load the most recent save (first in the list, sorted by date)
      await this.loadWorld(saveFiles[0].path);
    } catch (error) {
      console.error('Error resuming last save:', error);
      alert(`Error resuming last save: ${error.message}`);
    }
  }

  showLoadDialog() {
    if (!this.saveLoadDialog) {
      console.error('SaveLoadDialog not initialized');
      return;
    }

    // Hide main menu and play submenu if visible
    if (this.mainMenu && this.gameState.getState() === GameState.MENU) {
      this.mainMenu.hide();
    }
    if (this.playSubmenu) {
      this.playSubmenu.hide();
    }

    // Show the dialog
    this.saveLoadDialog.show();
  }

  async loadWorld(filePath) {
    if (!filePath) {
      console.error('No file path provided to loadWorld');
      return;
    }

    try {
      // Load save data
      if (!window.electronAPI || !window.electronAPI.loadWorld) {
        console.error('Electron API not available');
        alert('Load functionality is not available. Please run the game in Electron.');
        return;
      }

      this.gameState.setState(GameState.LOADING);
      
      const result = await window.electronAPI.loadWorld(filePath);
      
      if (!result.success) {
        console.error('Failed to load world:', result.error);
        alert(`Failed to load world: ${result.error}`);
        this.gameState.setState(GameState.MENU);
        if (this.mainMenu) {
          this.mainMenu.show();
        }
        return;
      }

      // Validate save data
      this.saveManager.validateSaveData(result.data);

      // Initialize scene manager if not already initialized
      if (!this.sceneManager) {
        this.mainMenu.hide();
        
        this.sceneManager = new SceneManager(this.container, this.audioManager);
        await this.sceneManager.init();
        
        // Update settings menu with tileGrid after scene manager is initialized
        if (this.sceneManager.tileGrid && this.settingsMenu) {
          this.settingsMenu.setTileGrid(this.sceneManager.tileGrid);
        }
      } else {
        // Clear existing world
        this.sceneManager.clearWorld();
      }

      // Restore world from save data
      this.sceneManager.restoreFromSave(result.data);

      // Start the game
      this.gameState.setState(GameState.PLAYING);
      this.mainMenu.hide();
      
      // Start gameplay music
      this.audioManager.playNextGameplayTrack();
      
      console.log('World loaded successfully');
    } catch (error) {
      console.error('Error loading world:', error);
      alert(`Error loading world: ${error.message}`);
      this.gameState.setState(GameState.MENU);
      if (this.mainMenu) {
        this.mainMenu.show();
      }
    }
  }

  returnToMenu() {
    this.gameState.setState(GameState.MENU);
    this.pauseMenu.hide();
    
    // Disconnect from WebSocket if connected
    if (this.wsClient && this.wsClient.isConnected) {
      this.wsClient.disconnect();
      this.wsClient = null;
      console.log('Disconnected from multiplayer server');
    }
    
    // Stop gameplay music
    this.audioManager.stopMusic();
    
    // Hide play submenu if visible
    if (this.playSubmenu) {
      this.playSubmenu.hide();
    }
    
    // Show main menu
    this.mainMenu.show();
  }

  gameLoop() {
    if (!this.isInitialized) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update scene only when playing
    if (this.sceneManager && this.gameState.getState() === GameState.PLAYING) {
      this.sceneManager.update(deltaTime);
    }

    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }
}

