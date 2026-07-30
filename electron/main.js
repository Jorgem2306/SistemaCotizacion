const { app, BrowserWindow } = require('electron');
const electronServe = require('electron-serve');
const serve = electronServe.default || electronServe;
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

// En producción, electron-serve servirá los archivos estáticos de Next.js de la carpeta 'out'
const loadURL = serve({ directory: 'out' });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Sistema de Cotizaciones'
  });

  // Ocultar el menú superior (Archivo, Edición, etc.)
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    loadURL(mainWindow);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
