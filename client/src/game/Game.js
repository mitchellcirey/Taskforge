import { SceneManager } from './SceneManager.js';
import { LoadingScreen } from '../ui/LoadingScreen.js';
import { MainMenu } from '../ui/MainMenu.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { SettingsMenu } from '../ui/SettingsMenu.js';
import { CreditsMenu } from '../ui/CreditsMenu.js';
import { CharacterMenu } from '../ui/CharacterMenu.js';
import { AchievementsMenu } from '../ui/AchievementsMenu.js';
import { AdminMenu } from '../ui/AdminMenu.js';
import { VersionWatermark } from '../ui/VersionWatermark.js';
import { NowPlayingUI } from '../ui/NowPlayingUI.js';
import { SaveLoadDialog } from '../ui/SaveLoadDialog.js';
import { SaveDialog } from '../ui/SaveDialog.js';
import { PlaySubmenu } from '../ui/PlaySubmenu.js';
import { NewGameDialog } from '../ui/NewGameDialog.js';
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
    this.characterMenu = null;
    this.achievementsMenu = null;
    this.adminMenu = null;
    // Store game instance globally for access from other modules
    window.gameInstance = this;
    this.versionWatermark = null;
    this.nowPlayingUI = null;
    this.saveLoadDialog = null;
    this.characterNameDialog = null;
    this.playSubmenu = null;
    this.newGameDialog = null;
    this.currentWorldName = null;
    this.currentWorldSeed = null;
    this.currentSavePath = null; // Track the current save file path
    this.gameState = new GameState();
    this.audioManager = new AudioManager();
    this.wsClient = null; // WebSocket client for multiplayer
    this.saveManager = new SaveManager();
    this.isInitialized = false;
    this.lastTime = 0;
    this.isStartingGame = false; // Prevent multiple simultaneous game starts
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
      // Show achievements menu and hide main menu
      this.mainMenu.hide();
      if (this.achievementsMenu) {
        this.achievementsMenu.show();
      }
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
    this.mainMenu.onCharacter(() => {
      // Show character menu and hide main menu
      this.mainMenu.hide();
      if (this.characterMenu) {
        this.characterMenu.show();
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

    // Create character menu
    this.characterMenu = new CharacterMenu(this.container);
    this.characterMenu.onClose(() => {
      // Return to main menu when character menu is closed
      if (this.gameState.getState() === GameState.MENU) {
        this.mainMenu.show();
      }
    });

    // Create achievements menu
    this.achievementsMenu = new AchievementsMenu(this.container);
    this.achievementsMenu.onClose(() => {
      // Return to appropriate menu when achievements menu is closed
      if (this.gameState.getState() === GameState.MENU) {
        this.mainMenu.show();
      } else if (this.gameState.getState() === GameState.PAUSED) {
        // Return to pause menu if we were in paused state
        if (this.pauseMenu) {
          this.pauseMenu.show();
        }
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
    this.pauseMenu.onAchievements(() => {
      // Show achievements menu
      if (this.achievementsMenu) {
        this.achievementsMenu.show();
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

    // Create save dialog
    this.saveDialog = new SaveDialog(this.container);
    this.saveDialog.onOverwrite(() => {
      this.performSave(true); // Overwrite existing save
    });
    this.saveDialog.onSaveAsNew(() => {
      this.performSave(false); // Save as new
    });
    this.saveDialog.onCancel(() => {
      // Show pause menu again if we were in paused state
      if (this.pauseMenu && this.gameState.getState() === GameState.PAUSED) {
        this.pauseMenu.show();
      }
    });

    // Create play submenu
    this.playSubmenu = new PlaySubmenu(this.container);
    this.playSubmenu.onNewGame(() => {
      if (this.newGameDialog) {
        this.newGameDialog.show();
      }
    });

    // Create new game dialog
    this.newGameDialog = new NewGameDialog(this.container);
    this.newGameDialog.onStart((worldName, seed) => {
      this.handleNewGame(worldName, seed);
    });
    this.newGameDialog.onCancel(() => {
      // Show play submenu again when canceled
      if (this.playSubmenu) {
        this.playSubmenu.show();
      }
    });
    this.playSubmenu.onLoadGame(() => {
      this.showLoadDialog();
    });
    this.playSubmenu.onMultiplayer(() => {
      // Check if character name is set
      if (!this.checkCharacterName()) {
        this.showCharacterNameWarning(() => {
          // Continue with multiplayer after name is set
          console.log('Multiplayer clicked');
          // TODO: Implement multiplayer functionality
        });
        return;
      }
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

    // Create now playing UI
    this.nowPlayingUI = new NowPlayingUI(this.container);

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

  checkCharacterName() {
    try {
      const characterName = localStorage.getItem('taskforge_characterName');
      return characterName && characterName.trim() !== '';
    } catch (error) {
      console.warn('Failed to check character name:', error);
      return false;
    }
  }

  showCharacterNameWarning(pendingAction = null) {
    // Create custom dialog if it doesn't exist
    if (!this.characterNameDialog) {
      this.createCharacterNameDialog();
    }
    // Store the pending action so we can continue after name is set
    this.characterNameDialog.pendingAction = pendingAction;
    this.characterNameDialog.show();
    return false; // Return false to prevent game from starting
  }

  createCharacterNameDialog() {
    this.characterNameDialog = document.createElement('div');
    this.characterNameDialog.id = 'character-name-dialog';
    this.characterNameDialog.innerHTML = `
      <div class="dialog-background"></div>
      <div class="dialog-content">
        <h2 class="dialog-title">Character Name Required</h2>
        <p class="dialog-message">Please set a character name before joining a game.</p>
        <div class="dialog-input-container">
          <label class="dialog-label" for="quick-name-input">Character Name</label>
          <input 
            type="text" 
            id="quick-name-input" 
            class="dialog-input" 
            placeholder="Enter your character name"
            maxlength="20"
            autofocus
          >
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button primary" id="set-name-button">
            <span class="button-text">Set Name</span>
          </button>
          <button class="dialog-button" id="character-menu-button">
            <span class="button-text">Full Customization</span>
          </button>
          <button class="dialog-button" id="cancel-dialog-button">
            <span class="button-text">Cancel</span>
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    if (!document.getElementById('character-name-dialog-styles')) {
      style.id = 'character-name-dialog-styles';
      style.textContent = `
        #character-name-dialog {
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
          pointer-events: auto;
        }

        #character-name-dialog.visible {
          display: flex;
        }

        #character-name-dialog:not(.visible) {
          pointer-events: none;
        }

        #character-name-dialog .dialog-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #87CEEB 100%);
          background-size: 100% 200%;
          animation: skyShift 20s ease infinite;
          opacity: 0.85;
          pointer-events: auto;
        }

        @keyframes skyShift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 0% 100%; }
        }

        #character-name-dialog .dialog-content {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.95);
          border: 3px solid #34495e;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          min-width: 400px;
          max-width: 500px;
          padding: 40px;
          animation: fadeInScale 0.3s ease-out;
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

        #character-name-dialog .dialog-title {
          color: #1a1a1a;
          font-size: 32px;
          margin: 0 0 20px 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          font-family: 'Arial', sans-serif;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-align: center;
        }

        #character-name-dialog .dialog-message {
          color: #1a1a1a;
          font-size: 16px;
          margin: 0 0 30px 0;
          font-family: 'Arial', sans-serif;
          text-align: center;
        }

        #character-name-dialog .dialog-input-container {
          margin-bottom: 30px;
        }

        #character-name-dialog .dialog-label {
          display: block;
          color: #1a1a1a;
          font-size: 16px;
          font-family: 'Arial', sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        #character-name-dialog .dialog-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #34495e;
          border-radius: 6px;
          font-size: 16px;
          font-family: 'Arial', sans-serif;
          color: #1a1a1a;
          background: rgba(255, 255, 255, 0.95);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        #character-name-dialog .dialog-input:focus {
          outline: none;
          border-color: #2c3e50;
          box-shadow: 0 0 0 3px rgba(52, 73, 94, 0.1);
        }

        #character-name-dialog .dialog-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        #character-name-dialog .dialog-button {
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          border: 3px solid #34495e;
          border-radius: 8px;
          color: #1a1a1a;
          font-size: 18px;
          padding: 12px 40px;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Arial', sans-serif;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        #character-name-dialog .dialog-button:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          transform: translateY(-2px);
          border-color: #2c3e50;
        }

        #character-name-dialog .dialog-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        #character-name-dialog .dialog-button.primary {
          background: rgba(52, 73, 94, 0.95);
          color: white;
        }

        #character-name-dialog .dialog-button.primary:hover {
          background: rgba(52, 73, 94, 1);
        }

        #character-name-dialog .button-text {
          position: relative;
          z-index: 1;
        }
      `;
      document.head.appendChild(style);
    }

    // Setup event listeners
    const nameInput = this.characterNameDialog.querySelector('#quick-name-input');
    const setNameButton = this.characterNameDialog.querySelector('#set-name-button');
    const characterMenuButton = this.characterNameDialog.querySelector('#character-menu-button');
    const cancelButton = this.characterNameDialog.querySelector('#cancel-dialog-button');

    // Load existing name if available
    try {
      const savedName = localStorage.getItem('taskforge_characterName');
      if (savedName) {
        nameInput.value = savedName;
      }
    } catch (error) {
      console.warn('Failed to load character name:', error);
    }

    // Set name button
    setNameButton.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (name && name.length > 0) {
        try {
          localStorage.setItem('taskforge_characterName', name);
          // Show success message briefly
          const buttonText = setNameButton.querySelector('.button-text');
          const originalText = buttonText ? buttonText.textContent : setNameButton.textContent;
          if (buttonText) {
            buttonText.textContent = 'Saved!';
          } else {
            setNameButton.textContent = 'Saved!';
          }
          setNameButton.disabled = true;
          
          const pendingAction = this.characterNameDialog.pendingAction;
          
          setTimeout(() => {
            this.characterNameDialog.hide();
            if (buttonText) {
              buttonText.textContent = originalText;
            } else {
              setNameButton.textContent = originalText;
            }
            setNameButton.disabled = false;
            this.characterNameDialog.pendingAction = null;
            
            // Continue with the pending action if one was stored
            if (pendingAction && typeof pendingAction === 'function') {
              // Small delay to ensure dialog is fully hidden and game state is ready
              setTimeout(() => {
                // Only continue if we're still in menu state (not already loading/playing)
                if (this.gameState.getState() === GameState.MENU) {
                  pendingAction();
                } else {
                  console.warn('Cannot continue action: game state is not MENU');
                }
              }, 200);
            }
          }, 500);
        } catch (error) {
          console.warn('Failed to save character name:', error);
          alert('Failed to save character name. Please try again.');
        }
      } else {
        // Show error on input
        nameInput.style.borderColor = '#e74c3c';
        nameInput.focus();
        setTimeout(() => {
          nameInput.style.borderColor = '#34495e';
        }, 2000);
      }
    });

    // Character menu button
    characterMenuButton.addEventListener('click', () => {
      this.characterNameDialog.hide();
      // Show character menu
      if (this.mainMenu) {
        this.mainMenu.hide();
      }
      if (this.playSubmenu) {
        this.playSubmenu.hide();
      }
      if (this.characterMenu) {
        this.characterMenu.show();
      }
    });

    // Cancel button
    cancelButton.addEventListener('click', () => {
      this.characterNameDialog.hide();
    });

    // Enter key to submit
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        setNameButton.click();
      }
    });

    // Add show/hide methods
    this.characterNameDialog.show = () => {
      if (!this.characterNameDialog.parentNode) {
        this.container.appendChild(this.characterNameDialog);
      }
      this.characterNameDialog.classList.add('visible');
      // Focus input after a brief delay to ensure it's visible
      setTimeout(() => {
        const input = this.characterNameDialog.querySelector('#quick-name-input');
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    };

    this.characterNameDialog.hide = () => {
      this.characterNameDialog.classList.remove('visible');
    };

    // Add to container but hidden initially
    this.container.appendChild(this.characterNameDialog);
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

  handleNewGame(worldName, seed) {
    // Store world name and seed for use in startGame
    this.currentWorldName = worldName;
    this.currentWorldSeed = seed;
    this.currentSavePath = null; // New game, no save file yet
    
    // Register world with server
    this.registerWorldWithServer(worldName, seed).catch(err => {
      console.warn('Failed to register world with server:', err);
      // Continue anyway - server registration is not critical
    });
    
    // Start the game with the seed
    this.startGame(seed);
  }

  async registerWorldWithServer(worldName, seed) {
    try {
      const response = await fetch('http://localhost:8081/worlds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ worldName, seed }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      console.log('World registered with server:', worldName, seed);
    } catch (error) {
      // Server might not be running - that's okay for now
      console.warn('Could not register world with server (server may not be running):', error);
    }
  }

  async startGame(seed = null) {
    // Prevent multiple simultaneous starts
    if (this.isStartingGame) {
      console.warn('Game start already in progress');
      return;
    }
    
    // Use provided seed or current world seed
    const worldSeed = seed !== null ? seed : (this.currentWorldSeed || null);

    // Check if character name is set
    if (!this.checkCharacterName()) {
      this.showCharacterNameWarning(() => {
        // Continue starting the game after name is set
        // Only if we're still in menu state
        if (this.gameState.getState() === GameState.MENU && !this.isStartingGame) {
          this.startGame();
        }
      });
      return;
    }

    // Double-check we're in the right state before starting
    if (this.gameState.getState() !== GameState.MENU && this.gameState.getState() !== GameState.PAUSED) {
      console.warn('Cannot start game: invalid game state', this.gameState.getState());
      return;
    }

    this.isStartingGame = true;
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
      
      await this.sceneManager.init(progressCallback, worldSeed);
      
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
      
      // Regenerate world with new seed if provided
      if (worldSeed !== null) {
        this.loadingScreen.setProgress(15);
        this.loadingScreen.setLoadingMessage('Regenerating world...');
        await new Promise(resolve => requestAnimationFrame(resolve));
        await delay(400);
        await this.sceneManager.regenerateWorld(worldSeed);
      }
      
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
      this.sceneManager.spawnTrees(400);
      this.sceneManager.spawnSticks(300);
      this.sceneManager.spawnStones(300);
      
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
    this.isStartingGame = false; // Reset flag when game is fully started
    
    // Start gameplay music with callback to show now playing UI
    this.audioManager.playNextGameplayTrack((trackName) => {
      if (this.nowPlayingUI) {
        this.nowPlayingUI.showTrack(trackName);
      }
    });
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

    // Check if Electron API is available
    if (!window.electronAPI || !window.electronAPI.saveWorld) {
      console.error('Electron API not available');
      alert('Save functionality is not available. Please run the game in Electron.');
      return;
    }

    // Check if this world has already been saved
    if (this.currentSavePath) {
      // Get the save file name from the path
      const saveFiles = await window.electronAPI.listSaveFiles();
      const existingSave = saveFiles.find(save => save.path === this.currentSavePath);
      
      if (existingSave) {
        // Show dialog asking to overwrite or save as new
        this.pauseMenu.hide(); // Hide pause menu while dialog is shown
        this.saveDialog.show(existingSave.name);
        return;
      } else {
        // Save path is set but file doesn't exist anymore, clear it
        this.currentSavePath = null;
      }
    }

    // No existing save, proceed with new save
    await this.performSave(false);
  }

  async performSave(overwrite = false) {
    if (!this.sceneManager) {
      console.error('Cannot save: SceneManager not initialized');
      return;
    }

    try {
      // Check if we're at the 5-save limit when saving as new
      if (!overwrite) {
        const saveFiles = await window.electronAPI.listSaveFiles();
        const MAX_SAVES = 5;
        
        if (saveFiles.length >= MAX_SAVES) {
          alert('You have reached the maximum of 5 save slots. Please delete a save file first before creating a new one.');
          // Show pause menu again
          if (this.pauseMenu && this.gameState.getState() === GameState.PAUSED) {
            this.pauseMenu.show();
          }
          return;
        }
      }

      // Capture screenshot before saving
      const screenshotDataURL = this.captureScreenshot();
      
      // Serialize game state (include world name and seed)
      const saveData = this.saveManager.serialize(
        this.sceneManager, 
        this.sceneManager.cameraController,
        this.currentWorldName,
        this.currentWorldSeed
      );
      
      // Save via Electron API (including screenshot)
      if (!window.electronAPI || !window.electronAPI.saveWorld) {
        console.error('Electron API not available');
        alert('Save functionality is not available. Please run the game in Electron.');
        return;
      }

      // If overwriting, pass the existing save path
      const savePath = overwrite ? this.currentSavePath : null;
      const result = await window.electronAPI.saveWorld(saveData, screenshotDataURL, savePath);
      
      if (result.success) {
        console.log('World saved successfully:', result.filePath);
        // Update current save path
        this.currentSavePath = result.filePath;
        // Show success message
        alert('World saved successfully!');
        // Show pause menu again if we were in paused state
        if (this.pauseMenu && this.gameState.getState() === GameState.PAUSED) {
          this.pauseMenu.show();
        }
      } else {
        console.error('Failed to save world:', result.error);
        alert(`Failed to save world: ${result.error}`);
        // Show pause menu again if we were in paused state
        if (this.pauseMenu && this.gameState.getState() === GameState.PAUSED) {
          this.pauseMenu.show();
        }
      }
    } catch (error) {
      console.error('Error saving world:', error);
      alert(`Error saving world: ${error.message}`);
      // Show pause menu again if we were in paused state
      if (this.pauseMenu && this.gameState.getState() === GameState.PAUSED) {
        this.pauseMenu.show();
      }
    }
  }

  async resumeLastSave() {
    // Check if character name is set
    if (!this.checkCharacterName()) {
      this.showCharacterNameWarning(() => {
        // Continue resuming save after name is set
        this.resumeLastSave();
      });
      return;
    }

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

    // Check if character name is set
    if (!this.checkCharacterName()) {
      this.showCharacterNameWarning(() => {
        // Continue loading world after name is set
        this.loadWorld(filePath);
      });
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
        this.isStartingGame = false; // Reset flag on error
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

      // Extract world name and seed from save data
      const saveSeed = migratedData.seed !== undefined ? migratedData.seed : null;
      const saveWorldName = migratedData.worldName || null;
      this.currentWorldName = saveWorldName;
      this.currentWorldSeed = saveSeed;
      // Track the save file path so we can overwrite it later
      this.currentSavePath = filePath;

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
        
        // Initialize with seed from save data
        await this.sceneManager.init(progressCallback, saveSeed);
        
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
        
        // Regenerate world with seed from save if available
        if (saveSeed !== null) {
          this.loadingScreen.setProgress(45);
          this.loadingScreen.setLoadingMessage('Regenerating world...');
          await new Promise(resolve => requestAnimationFrame(resolve));
          await delay(400);
          await this.sceneManager.regenerateWorld(saveSeed);
        }
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
      
      // Start gameplay music with callback to show now playing UI
      this.audioManager.playNextGameplayTrack((trackName) => {
        if (this.nowPlayingUI) {
          this.nowPlayingUI.showTrack(trackName);
        }
      });
      
      console.log('World loaded successfully');
    } catch (error) {
      console.error('Error loading world:', error);
      alert(`Error loading world: ${error.message}`);
      this.isStartingGame = false; // Reset flag on error
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
    this.isStartingGame = false; // Reset flag when returning to menu
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

