import { SceneManager } from './SceneManager.js';
import { LoadingScreen } from '../ui/LoadingScreen.js';
import { MainMenu } from '../ui/MainMenu.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { SettingsMenu } from '../ui/SettingsMenu.js';
import { CreditsMenu } from '../ui/CreditsMenu.js';
import { AdminMenu } from '../ui/AdminMenu.js';
import { VersionWatermark } from '../ui/VersionWatermark.js';
import { SaveLoadDialog } from '../ui/SaveLoadDialog.js';
import { PlaySubmenu } from '../ui/PlaySubmenu.js';
import { GameState } from './GameState.js';
import { getItemTypeRegistry } from './ItemTypeRegistry.js';
import { ItemType } from './items/ItemType.js';
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
    this.creditsMenu = null;
    this.adminMenu = null;
    // Store game instance globally for access from other modules
    window.gameInstance = this;
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

    // Preload all item models for better performance
    try {
      const registry = getItemTypeRegistry();
      const allItemTypes = registry.getAll();
      const itemIds = allItemTypes.map(item => item.getId());
      await ItemType.preloadAllModels(itemIds);
    } catch (e) {
      console.warn('Some models could not be preloaded, will use legacy build methods:', e);
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
      // Open settings menu
      if (this.settingsMenu) {
        this.settingsMenu.show();
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

    // Create credits menu
    this.creditsMenu = new CreditsMenu(this.container);
    this.creditsMenu.onClose(() => {
      // Return to main menu when credits is closed
      if (this.gameState.getState() === GameState.MENU) {
        this.mainMenu.show();
      }
    });

    // Create settings menu (used both in main menu and in-game)
    this.settingsMenu = new SettingsMenu(this.container, null, this.audioManager);
    // Apply audio settings after sounds are loaded
    this.settingsMenu.applyAudioSettings();
    this.settingsMenu.onClose(() => {
      // Return to appropriate menu when settings is closed
      if (this.gameState.getState() === GameState.PAUSED) {
        this.pauseMenu.show();
      } else if (this.gameState.getState() === GameState.MENU) {
        this.mainMenu.show();
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
    this.pauseMenu.onLoadWorld(() => {
      this.showLoadDialog();
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
      // Show pause menu again if we were in paused state
      if (this.pauseMenu && this.gameState.getState() === GameState.PAUSED) {
        this.pauseMenu.show();
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

    // Add GameState listener to automatically manage menu music
    this.gameState.onStateChange('*', (newState, oldState) => {
      this.handleStateChange(newState, oldState);
    });

    // Set initial state (this will trigger the listener and start menu music)
    this.gameState.setState(GameState.MENU);
    
    // Manually trigger menu music if we're starting in MENU state
    // (since setState won't trigger if state hasn't changed)
    if (this.gameState.getState() === GameState.MENU) {
      this.audioManager.playMusic('main_menu');
    }

    // Hide loading screen
    this.loadingScreen.hide();

    // Start game loop
    this.isInitialized = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  handleStateChange(newState, oldState) {
    // Automatically manage menu music based on game state
    if (newState === GameState.MENU) {
      // Play menu music when entering menu state
      this.audioManager.playMusic('main_menu');
    } else if (newState === GameState.PLAYING || newState === GameState.PAUSED || newState === GameState.LOADING) {
      // Stop menu music when leaving menu state
      // Only stop if we're transitioning from MENU (to avoid stopping gameplay music)
      if (oldState === GameState.MENU) {
        this.audioManager.stopMusic();
      }
    }
  }

  async startGame() {
    this.gameState.setState(GameState.LOADING);
    this.mainMenu.hide();

    // Show loading screen
    if (!this.loadingScreen) {
      this.loadingScreen = new LoadingScreen(this.container);
    }
    this.loadingScreen.show();
    this.loadingScreen.setProgress(0);
    this.loadingScreen.setLoadingMessage('Starting game...');
    
    // Give the browser a moment to render the loading screen
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Initialize scene manager
    if (!this.sceneManager) {
      // First time initialization
      this.sceneManager = new SceneManager(this.container, this.audioManager);
      
      // Create progress callback
      const progressCallback = (message, percentage) => {
        if (this.loadingScreen) {
          this.loadingScreen.setLoadingMessage(message);
          this.loadingScreen.setProgress(percentage);
        }
      };
      
      await this.sceneManager.init(progressCallback);
      
      // Update settings menu with tileGrid after scene manager is initialized
      if (this.sceneManager.tileGrid && this.settingsMenu) {
        this.settingsMenu.setTileGrid(this.sceneManager.tileGrid);
      }
    } else {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Reset existing world for new game
      this.loadingScreen.setProgress(10);
      this.loadingScreen.setLoadingMessage('Clearing world...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(400);
      this.sceneManager.clearWorld();
      
      // Reset player to starting position
      this.loadingScreen.setProgress(30);
      this.loadingScreen.setLoadingMessage('Resetting player...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(400);
      const startTile = this.sceneManager.tileGrid.getTile(
        Math.floor(this.sceneManager.tileGrid.width / 2),
        Math.floor(this.sceneManager.tileGrid.height / 2)
      );
      if (startTile && this.sceneManager.player) {
        this.sceneManager.player.mesh.position.set(startTile.worldX, this.sceneManager.player.mesh.position.y, startTile.worldZ);
        this.sceneManager.player.currentTile = startTile;
        this.sceneManager.player.path = [];
        this.sceneManager.player.isMoving = false;
        this.sceneManager.player.targetPosition = null;
        
        // Clear player inventory
        if (this.sceneManager.player.inventory) {
          this.sceneManager.player.inventory.clear();
          if (this.sceneManager.player.updateHandItem) {
            this.sceneManager.player.updateHandItem();
          }
        }
      }
      
      // Regenerate world objects
      this.loadingScreen.setProgress(60);
      this.loadingScreen.setLoadingMessage('Spawning world objects...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(500);
      this.sceneManager.spawnTrees(30);
      this.sceneManager.spawnSticks(20);
      
      // Hook harvestable objects to process harvest results (same as in init)
      // Use regular function with stored reference to ensure proper context
      const sceneManager = this.sceneManager;
      this.sceneManager.worldObjects.forEach(obj => {
        if (obj.harvest && typeof obj.harvest === 'function') {
          const originalHarvest = obj.harvest.bind(obj);
          obj.harvest = function() {
            const results = originalHarvest();
            if (results && Array.isArray(results)) {
              sceneManager.processHarvestResults(obj, results);
            }
            return results;
          };
        }
      });
      
      // Reset camera to default position
      this.loadingScreen.setProgress(80);
      this.loadingScreen.setLoadingMessage('Resetting camera...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(300);
      if (this.sceneManager.cameraController) {
        const startTile = this.sceneManager.tileGrid.getTile(
          Math.floor(this.sceneManager.tileGrid.width / 2),
          Math.floor(this.sceneManager.tileGrid.height / 2)
        );
        if (startTile) {
          this.sceneManager.cameraController.focusPoint.set(startTile.worldX, 0, startTile.worldZ);
          this.sceneManager.cameraController.yaw = 0;
          this.sceneManager.cameraController.pitch = Math.PI / 4; // 45 degrees
          this.sceneManager.cameraController.distance = 20;
          this.sceneManager.cameraController.updateCameraPosition();
        }
      }
      
      this.loadingScreen.setProgress(100);
      this.loadingScreen.setLoadingMessage('Finalizing...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(300);
    }

    // Hide loading screen
    if (this.loadingScreen) {
      this.loadingScreen.hide();
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
      
      // Show loading screen
      if (!this.loadingScreen) {
        this.loadingScreen = new LoadingScreen(this.container);
      }
      this.loadingScreen.show();
      this.loadingScreen.setProgress(0);
      this.loadingScreen.setLoadingMessage('Loading save file...');
      
      // Give the browser a moment to render the loading screen
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      const result = await window.electronAPI.loadWorld(filePath);
      
      if (!result.success) {
        console.error('Failed to load world:', result.error);
        alert(`Failed to load world: ${result.error}`);
        this.gameState.setState(GameState.MENU);
        if (this.loadingScreen) {
          this.loadingScreen.hide();
        }
        if (this.mainMenu) {
          this.mainMenu.show();
        }
        return;
      }

      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Migrate save data to current version
      this.loadingScreen.setProgress(20);
      this.loadingScreen.setLoadingMessage('Processing save data...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(400);
      const migratedData = this.saveManager.migrateSaveData(result.data);
      
      // Validate save data
      this.saveManager.validateSaveData(migratedData);

      // Initialize scene manager if not already initialized
      if (!this.sceneManager) {
        this.mainMenu.hide();
        
        this.loadingScreen.setProgress(40);
        this.loadingScreen.setLoadingMessage('Initializing world...');
        await new Promise(resolve => requestAnimationFrame(resolve));
        await delay(300);
        
        this.sceneManager = new SceneManager(this.container, this.audioManager);
        
        // Create progress callback that combines world init with restore progress
        const progressCallback = (message, percentage) => {
          // Map SceneManager progress (0-100) to our range (40-60)
          const mappedPercentage = 40 + (percentage * 0.2);
          if (this.loadingScreen) {
            this.loadingScreen.setLoadingMessage(message);
            this.loadingScreen.setProgress(mappedPercentage);
          }
        };
        
        await this.sceneManager.init(progressCallback);
        
        // Update settings menu with tileGrid after scene manager is initialized
        if (this.sceneManager.tileGrid && this.settingsMenu) {
          this.settingsMenu.setTileGrid(this.sceneManager.tileGrid);
        }
      } else {
        // Clear existing world
        this.loadingScreen.setProgress(40);
        this.loadingScreen.setLoadingMessage('Clearing world...');
        await new Promise(resolve => requestAnimationFrame(resolve));
        await delay(400);
        this.sceneManager.clearWorld();
      }

      // Restore world from migrated save data
      this.loadingScreen.setProgress(60);
      this.loadingScreen.setLoadingMessage('Restoring buildings...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(500);
      this.sceneManager.restoreFromSave(migratedData);
      
      this.loadingScreen.setProgress(80);
      this.loadingScreen.setLoadingMessage('Restoring world objects...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(400);
      
      this.loadingScreen.setProgress(100);
      this.loadingScreen.setLoadingMessage('Finalizing...');
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(300);

      // Hide loading screen
      if (this.loadingScreen) {
        this.loadingScreen.hide();
      }

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
      if (this.loadingScreen) {
        this.loadingScreen.hide();
      }
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

