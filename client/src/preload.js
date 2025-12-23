const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Save/Load APIs
  saveWorld: (data, screenshotDataURL) => ipcRenderer.invoke('save-world', data, screenshotDataURL),
  loadWorld: (filePath) => ipcRenderer.invoke('load-world', filePath),
  getSaveDirectory: () => ipcRenderer.invoke('get-save-directory'),
  listSaveFiles: () => ipcRenderer.invoke('list-save-files'),
  // Get screenshot as data URL
  getScreenshot: (filePath) => ipcRenderer.invoke('get-screenshot', filePath),
  
  // Quit API (already used in MainMenu)
  quit: () => {
    if (ipcRenderer.send) {
      ipcRenderer.send('app-quit');
    }
  }
});


