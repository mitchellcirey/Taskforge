import { SceneManager } from './SceneManager.js';
import { LoadingScreen } from '../ui/LoadingScreen.js';
import { MainMenu } from '../ui/MainMenu.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { SettingsMenu } from '../ui/SettingsMenu.js';
import { AdminMenu } from '../ui/AdminMenu.js';
import { VersionWatermark } from '../ui/VersionWatermark.js';
import { GameState } from './GameState.js';
import { AudioManager } from './AudioManager.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.sceneManager = null;
    this.loadingScreen = null;
    this.mainMenu = null;
    this.pauseMenu = null;
    this.settingsMenu = null;
    this.adminMenu = null;
    this.versionWatermark = null;
    this.gameState = new GameState();
    this.audioManager = new AudioManager();
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
    this.mainMenu.onPlay(() => this.startGame());
    this.mainMenu.onLoadGame(() => {
      // Placeholder for load game
      console.log('Load Game clicked');
      // TODO: Implement game loading functionality
    });
    this.mainMenu.onMultiplayer(() => {
      // Placeholder for multiplayer
      console.log('Multiplayer clicked');
      // TODO: Implement multiplayer functionality
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
      // Placeholder for credits
      console.log('Credits clicked');
      // TODO: Implement credits/about screen
    });
    this.mainMenu.show();

    // Create settings menu (basic version, will be updated when game starts)
    this.settingsMenu = new SettingsMenu(this.container, null);
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

    // Create admin menu
    this.adminMenu = new AdminMenu(this.container);

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

  returnToMenu() {
    this.gameState.setState(GameState.MENU);
    this.pauseMenu.hide();
    
    // Stop gameplay music
    this.audioManager.stopMusic();
    
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

