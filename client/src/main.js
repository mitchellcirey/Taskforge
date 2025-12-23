const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

let mainWindow;

function createWindow() {
  // Get the correct paths based on where Electron is running from
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const appPath = app.getAppPath();
  const distPath = path.join(appPath, 'dist');
  const publicPath = path.join(appPath, 'public');
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false, // Don't show until maximized
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Allow loading local resources
    },
    icon: path.join(publicPath, 'images/icon.ico'),
    title: 'Taskforge: Automation'
  });
  
  // Maximize the window before showing it
  mainWindow.maximize();
  mainWindow.show();

  // Load the app - always load from dist for now
  // To use dev server, run: npm run dev (in one terminal) and npm run electron (in another)
  const indexPath = path.join(distPath, 'index.html');
  mainWindow.loadFile(indexPath).catch(err => {
    console.error('Failed to load app:', err);
    console.error('Dist path:', distPath);
    console.error('Index path:', indexPath);
    mainWindow.loadURL('data:text/html,<h1>Build error. Please run: cd client && npm run build:dev</h1>');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Get save directory path
function getSaveDirectory() {
  const documentsPath = app.getPath('documents');
  return path.join(documentsPath, 'Taskforge', 'saves');
}

// Ensure save directory exists
async function ensureSaveDirectory() {
  const saveDir = getSaveDirectory();
  if (!existsSync(saveDir)) {
    await fs.mkdir(saveDir, { recursive: true });
  }
  return saveDir;
}

// Generate save folder name with timestamp
function generateSaveFolderName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2024-01-15T14-30-25
  return `save_${timestamp}`;
}

// Convert base64 data URL to buffer
function base64ToBuffer(base64String) {
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Helper function to get all save folders sorted by date (oldest last)
async function getAllSaveFolders() {
  try {
    const saveDir = await ensureSaveDirectory();
    const items = await fs.readdir(saveDir, { withFileTypes: true });
    
    const saveFolders = items
      .filter(item => item.isDirectory() && item.name.startsWith('save_'))
      .map(item => {
        const folderPath = path.join(saveDir, item.name);
        const saveFilePath = path.join(folderPath, 'save.json');
        return {
          folderName: item.name,
          folderPath: folderPath,
          saveFilePath: saveFilePath
        };
      });
    
    // Get stats and filter valid saves
    const savesWithStats = await Promise.all(
      saveFolders.map(async (folder) => {
        try {
          const stats = await fs.stat(folder.saveFilePath);
          return {
            folderPath: folder.folderPath,
            modifiedTime: stats.mtime.getTime()
          };
        } catch (e) {
          return null;
        }
      })
    );
    
    const validSaves = savesWithStats.filter(save => save !== null);
    // Sort by modification time (most recent first, oldest last)
    validSaves.sort((a, b) => b.modifiedTime - a.modifiedTime);
    
    return validSaves;
  } catch (error) {
    console.error('Error getting save folders:', error);
    return [];
  }
}

// IPC Handlers
ipcMain.handle('save-world', async (event, saveData, screenshotDataURL = null) => {
  try {
    const saveDir = await ensureSaveDirectory();
    
    // Check if we're at the 5-save limit and delete oldest if needed
    const existingSaves = await getAllSaveFolders();
    const MAX_SAVES = 5;
    
    if (existingSaves.length >= MAX_SAVES) {
      // Delete the oldest save (last in the sorted array)
      const oldestSave = existingSaves[existingSaves.length - 1];
      try {
        await fs.rm(oldestSave.folderPath, { recursive: true, force: true });
        console.log(`Deleted oldest save: ${oldestSave.folderPath}`);
      } catch (deleteError) {
        console.error('Error deleting oldest save:', deleteError);
        // Continue anyway - we'll try to save the new one
      }
    }
    
    const folderName = generateSaveFolderName();
    const saveFolderPath = path.join(saveDir, folderName);
    
    // Create save folder if it doesn't exist
    if (!existsSync(saveFolderPath)) {
      await fs.mkdir(saveFolderPath, { recursive: true });
    }
    
    // Save game data
    const fileName = 'save.json';
    const filePath = path.join(saveFolderPath, fileName);
    await fs.writeFile(filePath, JSON.stringify(saveData, null, 2), 'utf8');
    
    // Save screenshot if provided
    let screenshotPath = null;
    if (screenshotDataURL) {
      screenshotPath = path.join(saveFolderPath, 'screenshot.png');
      const screenshotBuffer = base64ToBuffer(screenshotDataURL);
      await fs.writeFile(screenshotPath, screenshotBuffer);
    }
    
    return { success: true, filePath, screenshotPath };
  } catch (error) {
    console.error('Error saving world:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-world', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const saveData = JSON.parse(data);
    return { success: true, data: saveData };
  } catch (error) {
    console.error('Error loading world:', error);
    return { success: false, error: error.message };
  }
});

// Handler to read screenshot file and return as base64 data URL
ipcMain.handle('get-screenshot', async (event, filePath) => {
  try {
    if (!filePath || !existsSync(filePath)) {
      return { success: false, error: 'Screenshot file not found' };
    }
    const screenshotBuffer = await fs.readFile(filePath);
    const base64 = screenshotBuffer.toString('base64');
    const dataURL = `data:image/png;base64,${base64}`;
    return { success: true, dataURL };
  } catch (error) {
    console.error('Error reading screenshot:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-save-directory', async () => {
  try {
    return await ensureSaveDirectory();
  } catch (error) {
    console.error('Error getting save directory:', error);
    return null;
  }
});

ipcMain.handle('list-save-files', async () => {
  try {
    const saveDir = await ensureSaveDirectory();
    const items = await fs.readdir(saveDir, { withFileTypes: true });
    
    // Filter to only directories that start with 'save_'
    const saveFolders = items
      .filter(item => item.isDirectory() && item.name.startsWith('save_'))
      .map(item => {
        const folderPath = path.join(saveDir, item.name);
        const saveFilePath = path.join(folderPath, 'save.json');
        const screenshotPath = path.join(folderPath, 'screenshot.png');
        return {
          folderName: item.name,
          folderPath: folderPath,
          saveFilePath: saveFilePath,
          screenshotPath: screenshotPath
        };
      });
    
    // Get stats for all save files (including metadata and screenshot existence)
    const savesWithStats = await Promise.all(
      saveFolders.map(async (folder) => {
        try {
          // Check if save.json exists
          let stats;
          try {
            stats = await fs.stat(folder.saveFilePath);
          } catch (e) {
            // Skip folders without save.json
            return null;
          }
          
          // Check if screenshot exists
          let hasScreenshot = false;
          try {
            await fs.access(folder.screenshotPath);
            hasScreenshot = true;
          } catch (e) {
            hasScreenshot = false;
          }
          
          return {
            name: folder.folderName, // Use folder name as the display name
            path: folder.saveFilePath,
            screenshotPath: hasScreenshot ? folder.screenshotPath : null,
            modifiedTime: stats.mtime.getTime(),
            modifiedDate: stats.mtime.toISOString(),
            size: stats.size
          };
        } catch (e) {
          console.warn(`Error processing save folder ${folder.folderName}:`, e);
          return null;
        }
      })
    );
    
    // Filter out null entries (folders without save.json)
    const validSaves = savesWithStats.filter(save => save !== null);
    
    // Sort by modification time (most recent first)
    validSaves.sort((a, b) => b.modifiedTime - a.modifiedTime);
    
    return validSaves;
  } catch (error) {
    console.error('Error listing save files:', error);
    return [];
  }
});

ipcMain.handle('delete-save', async (event, saveFilePath) => {
  try {
    if (!saveFilePath) {
      return { success: false, error: 'No save file path provided' };
    }
    
    // Extract the folder path from the save file path
    // saveFilePath is like: .../saves/save_TIMESTAMP/save.json
    // We need to delete the entire folder: .../saves/save_TIMESTAMP
    const folderPath = path.dirname(saveFilePath);
    
    // Verify it's a save folder (starts with 'save_')
    const folderName = path.basename(folderPath);
    if (!folderName.startsWith('save_')) {
      return { success: false, error: 'Invalid save folder' };
    }
    
    // Delete the entire folder
    await fs.rm(folderPath, { recursive: true, force: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting save:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for quit
ipcMain.on('app-quit', () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle quit request from renderer
ipcMain.on('app-quit', () => {
  app.quit();
});

