export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.currentMusic = null;
    this.musicVolume = 0.5;
    this.menuMusicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.isMuted = false;
    this.musicMuted = false;
    this.menuMusicMuted = false;
    this.sfxMuted = false;
    this.gameplayMusicTracks = [];
    this.currentGameplayTrackIndex = 0;
    
    // Load mute states and menu music volume from localStorage
    try {
      const savedMusicMuted = localStorage.getItem('taskforge_musicMuted');
      if (savedMusicMuted !== null) {
        this.musicMuted = savedMusicMuted === 'true';
      }
      const savedMenuMusicMuted = localStorage.getItem('taskforge_menuMusicMuted');
      if (savedMenuMusicMuted !== null) {
        this.menuMusicMuted = savedMenuMusicMuted === 'true';
      }
      const savedSfxMuted = localStorage.getItem('taskforge_sfxMuted');
      if (savedSfxMuted !== null) {
        this.sfxMuted = savedSfxMuted === 'true';
      }
      const savedMenuMusicVolume = localStorage.getItem('taskforge_menuMusicVolume');
      if (savedMenuMusicVolume !== null) {
        this.menuMusicVolume = parseFloat(savedMenuMusicVolume);
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  loadSound(name, path, isMusic = false) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(path);
      audio.loop = isMusic;
      audio.volume = isMusic ? this.musicVolume : this.sfxVolume;
      // Apply mute state based on sound type
      if (isMusic) {
        // Menu music uses menuMusicMuted, gameplay music uses musicMuted
        audio.muted = name === 'main_menu' ? this.menuMusicMuted : this.musicMuted;
      } else {
        audio.muted = this.sfxMuted;
      }
      
      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(name, audio);
        resolve(audio);
      });

      audio.addEventListener('error', (e) => {
        console.error(`Error loading sound ${name}:`, e);
        reject(e);
      });

      audio.load();
    });
  }

  playSound(name, volume = null) {
    const sound = this.sounds.get(name);
    if (sound) {
      if (volume !== null) {
        sound.volume = volume;
      }
      // Apply SFX mute state
      sound.muted = this.sfxMuted;
      sound.currentTime = 0;
      sound.play().catch(e => {
        console.warn(`Could not play sound ${name}:`, e);
      });
    }
  }

  playMusic(name, loop = true, onPlayCallback = null) {
    // Stop current music
    if (this.currentMusic) {
      this.stopMusic();
    }

    const music = this.sounds.get(name);
    if (music) {
      music.loop = loop;
      // Use menuMusicVolume for main_menu track, musicVolume for gameplay tracks
      music.volume = name === 'main_menu' ? this.menuMusicVolume : this.musicVolume;
      // Use menuMusicMuted for main_menu track, musicMuted for gameplay tracks
      music.muted = name === 'main_menu' ? this.menuMusicMuted : this.musicMuted;
      this.currentMusic = music;
      music.play().then(() => {
        // Call callback when music successfully starts playing
        if (onPlayCallback && typeof onPlayCallback === 'function') {
          onPlayCallback(name);
        }
      }).catch(e => {
        console.warn(`Could not play music ${name}:`, e);
      });
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    // Only update current music volume if it's not the menu music
    if (this.currentMusic && this.currentMusic !== this.sounds.get('main_menu')) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  setMenuMusicVolume(volume) {
    this.menuMusicVolume = Math.max(0, Math.min(1, volume));
    // Update menu music volume if it's currently playing
    const menuMusic = this.sounds.get('main_menu');
    if (menuMusic && this.currentMusic === menuMusic) {
      this.currentMusic.volume = this.menuMusicVolume;
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMuted(muted) {
    this.isMuted = muted;
    this.sounds.forEach(sound => {
      sound.muted = muted;
    });
  }

  // Shuffle gameplay music
  loadGameplayMusic(trackNames) {
    this.gameplayMusicTracks = trackNames;
    this.currentGameplayTrackIndex = 0;
  }

  playNextGameplayTrack(onPlayCallback = null) {
    if (this.gameplayMusicTracks.length === 0) return;

    const trackName = this.gameplayMusicTracks[this.currentGameplayTrackIndex];
    this.playMusic(trackName, false, onPlayCallback);

    // When track ends, play next
    const music = this.sounds.get(trackName);
    if (music) {
      music.addEventListener('ended', () => {
        this.currentGameplayTrackIndex = (this.currentGameplayTrackIndex + 1) % this.gameplayMusicTracks.length;
        this.playNextGameplayTrack(onPlayCallback);
      }, { once: true });
    }
  }

  // Generate pickup sound effect using Web Audio API
  playPickupSound() {
    if (!this.audioContext || this.isMuted) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Create a quick "pluck" sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Generate drop sound effect using Web Audio API
  playDropSound() {
    if (!this.audioContext || this.isMuted) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Create a "thud" sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }
}

