const { app, BrowserWindow } = require('electron');
const path = require('path');

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

