const { app, BrowserWindow, Tray, ipcMain, globalShortcut, nativeImage, Menu, dialog} = require('electron');
const path = require('path');
const { isDev, indexUrl } = require('./config');

const fs = require('fs');


/*const AutoLaunch = require('auto-launch');*/
const electron = require("electron");

let mainWindow,
    shortcutCapture,
    typeHotkeyMap = {};
let willQuitApp = false;

function appStart() {
  const shouldQuit = app.makeSingleInstance(() => {
    // Birisi ikinci bir örneği çalıştırmaya çalıştı, penceremize odaklanmalıyız.
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  if (shouldQuit) {
    app.quit();
  }

}

function createWindow() {
  const ShortcutCapture = require('./shortcut-window');
  // Tarayıcı penceresini oluşturun.
  mainWindow = new BrowserWindow({
    width: 716,
    height: 400,
    show: false,
    icon: path.join(__dirname, '/logo.png'),
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false,
      preload: path.join(__dirname, './common/prescreenshot.js')
    }
  });
  global.__mainWindow__ = mainWindow;
  mainWindow.loadURL(indexUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (e) => {
    if (willQuitApp) {
      mainWindow = null;
    } else if (process.platform === 'darwin' || process.platform === 'win32') {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Pencere kapatıldığında yayılır
  mainWindow.on('closed', () => {
    console.log('Main window is closed.');
  });


  mainWindow.setFullScreen(false);
  mainWindow.webContents.on('did-finish-load', () => {
    shortcutCapture = new ShortcutCapture();

  });

  const options_for_second_instance_lock = {
    type: 'info',
    buttons: ['OK'],
    title: 'Çalışıyor',
    message: 'T-Shotter Zaten Çalışıyor. Ekran görüntüsü almak için Ctrl+Alt+D tuşlarını kullanın.',
  };
  const options_for_quit = {
    type: 'question',
    buttons: ['No', 'Yes'],
    defaultId: 1,
    title: 'Çıkış',
    message: 'Çıkış yapmak istediğinizden emin misiniz?',
  };

  /*var tShotter = new AutoLaunch({
    name: 'T-shotter',
  });
  tShotter.enable();

  tShotter.isEnabled()
      .then(function(isEnabled){
        if(isEnabled){
          return;
        }
        tShotter.enable();
      })
      .catch(function(err){
        // handle error
      });*/

  const iconPath = path.join(__dirname, "/logo.png");

  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.on('click', () => __mainWindow__.webContents.send('shortcut-capture','BlPhmZ5dDdN95gyGsERFjU8'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Çalıştır", click: function () {
        console.log('shortcut-capture.globalShortcut');
        __mainWindow__.webContents.send('shortcut-capture','BlPhmZ5dDdN95gyGsERFjU8')
      }
    },
    {
      label: "Çıkış", click: function () {
        dialog.showMessageBox(null, options_for_quit).then(result => {
              if (result.response)
                app.quit();
            }
        );
      }
    },
  ])

  tray.setToolTip('T-Shotter')
  tray.setContextMenu(contextMenu)

}

// Elektron bittiğinde bu yöntem çağrılacak
// başlatma ve tarayıcı pencereleri oluşturmaya hazır.
// Bazı API'ler ancak bu olay gerçekleştikten sonra kullanılabilir.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  mainWindow.show();
});

app.on('certificate-error', (event, webContents, requestUrl, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

app.on('before-quit', () => {
  willQuitApp = true;
});

app.on('quit', () => {
  console.log('App is quiting...');
});

process.on('uncaughtException', (err) => {
  console.log(err);
  process.exit(500);
});


const hotkeyTypeActionMap = {
  hideMainWindow: () => {
    console.log('Trigger ctrl+w');
    mainWindow.hide();
  },
  screenCapture:()=>{
    console.log('Trigger screen capture');
    mainWindow.webContents.send('shortcut-capture')
  }
};

const configHotkey = (type, hotkeyString) => {
  typeHotkeyMap[type] && globalShortcut.unregister(typeHotkeyMap[type]);
  if (hotkeyTypeActionMap[type]) {
    typeHotkeyMap[type] = hotkeyString;
    globalShortcut.register(hotkeyString, () => {
      hotkeyTypeActionMap[type]();
    });
  }
};
const unregisterAllHotkey = () => {
  for (const type in typeHotkeyMap) {
    globalShortcut.unregister(typeHotkeyMap[type]);
  }
};

const unregisterHotkeyByType = (type) => {
  if( typeHotkeyMap[type]) {
    globalShortcut.unregister(typeHotkeyMap[type]);
  }
};

//  Genel kısayol tuşlarını kaydetmenin ekran görüntüsü
ipcMain.on('anp::UPDATE_SREENSHOT_HOT_KEY', (e, hotkey) => {
  console.log('UPDATE_SREENSHOT_HOT_KEY', e, hotkey);
  configHotkey("screenCapture",hotkey)
});
ipcMain.on('anp::REMOVE_SREENSHOT_HOT_KEY', (e) => {
  console.log('REMOVE_SREENSHOT_HOT_KEY');
  unregisterHotkeyByType("screenCapture");
});


appStart();
