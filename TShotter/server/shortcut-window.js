const {
    globalShortcut,
    ipcMain,
    BrowserWindow,
    desktopCapturer,
    screen
} = require('electron');
const path = require('path');
const {shotcutUrl,server,isDev} = require('./config')

// İşlevin yalnızca bir kez yürütüldüğünden emin olun
let isRuned = false
const $windows = []
let isClose = false
module.exports = class shortcutCapture{
    constructor(){
        if(isRuned){return}
        isRuned=true;
        // Kısayol
        globalShortcut.register('printScreen', function () {
            console.log('shortcut-capture.globalShortcut');
            //Şu anda burada bir bağlayıcı yazıyor, daha sonra ayrı olmayan bir oturumun ekran görüntüsünü eklerseniz, lütfen bağlayıcıyı geçmeyin
            //__mainWindow__.webContents.send('shortcut-capture')
            __mainWindow__.webContents.send('shortcut-capture','BlPhmZ5dDdN95gyGsERFjU8')

        });
        // Ekran görüntülerini klasöre gönder
        ipcMain.on('anp::SHORTCUT_CAPTURE_BY_BINDERID', (e, binderId) => {
            console.log('shortcut-capture-by-binderid', e, binderId);
            __mainWindow__.webContents.send('shortcut-capture', binderId);
        });
        // Ekran görüntüsü aldıktan sonra pencereyi göster
        ipcMain.on('shortcut-captureed', (e,source,obj) => {
            this.$sendObj=obj;
            this.closeWindow();
            this.createWindow(source,__mainWindow__);
        })

        ipcMain.on('cancel-shortcut-capture', (e) => {
            this.closeWindow();
        });

        ipcMain.on('send-shortcut-capture', (e, dataURL) => {
            this.closeWindow();
            __mainWindow__.webContents.send('upload-shortcut-file',this.$sendObj,dataURL);
        })
    }

    createWindow (source,__mainWindow__) {
        if($windows.length)return;
        const $win = new BrowserWindow({
            fullscreen: true,
            width: 900,
            height: 800,
            alwaysOnTop: true,
            skipTaskbar: false,
            autoHideMenuBar: true,
            show:false,
            icon: path.join(__dirname, '/logo.png'),
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                plugins:true,
                preload: path.join(__dirname, './common/imageRect.js')
            }
        })

        // this.setFullScreen($win, display)
        // Pencere sadece iptal butonu ile kapatma
        $win.on('close', e => {
            this.closeWindow();
        })

        if (isDev) {
            $win.webContents.openDevTools();
        }

        // Sayfa başlatıldıktan sonra pencereyi görüntüle
        // ve sürüm güncellemesi olup olmadığını kontrol edin
        $win.once('ready-to-show', () => {
            __mainWindow__.hide();
            $win.show()
            $win.focus()
            // Pencereleri yeniden konumlandırın ve yeniden boyutlandırın
            // this.setFullScreen($win, display)
        })
        $win.webContents.on('dom-ready', () => {
            //$win.webContents.executeJavaScript(`window.source = ${JSON.stringify(source)}`)
            $win.webContents.send('dom-ready')
            $win.focus()
        })
        $win.loadURL(`${shotcutUrl}`)
        $windows.push($win)
    }

    closeWindow () {
        isClose = true
        while ($windows.length) {
            const $winItem = $windows.pop()
            $winItem.close()
        }
        isClose = false
    }


}
  



  