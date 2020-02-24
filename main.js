const {app, BrowserWindow, ipcMain, dialog } = require('electron');
// ipc stands for InterProcessCommunication
let win;

const { MONGO_SHELL, MONGO_USER, MONGO_PWD, PRINTER_USER, PRINTER_PASS } = require('./config').config;
const {getSetting, updateFileDirectory, createDefaultSettings, getMachineName } = require('./electron_main/settings');
const { saveLog } = require('./electron_main/logs');
const { directoryLog, errorLog, appLog, printer_directory_setting, printer_queue_setting } = require('./electron_main/consts');
const { activateQueueCron, getPanelFlag, panelCronStopCheck, getQueueData } = require('./electron_main/queue'); //when queue becomes relevant again

const defaultDirectory = __dirname + '/directory';
let isLoggedIn = false;

//connect mongoose & init dbs
const mongoose = require('mongoose');
let mongo_connection_string = MONGO_SHELL + MONGO_PWD;
mongoose.Promise = global.Promise;
mongoose.connect(mongo_connection_string, {
    user: MONGO_USER,
    pass: MONGO_PWD,
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
    function (err) {
    if (err) {
        dialog.showMessageBox(win, {title: 'Error', message: 'error connecting to mongo!'});
        saveLog('Cannot connect to mongo ' + err, errorLog);
    } else {       
      console.log("Connected to mongo. ");
    }
  });
  mongoose.Authorization

function createWindow() {
    win = new BrowserWindow({
        useContentSize:true,
        focusable: true,
        resizable: true,
        titleBarStyle: 'default',
        frame: true,       
        webPreferences: {
            nodeIntegration: true
        },
        icon: 'file://${__dirname}/dist/electron-test/assets/logo.png'
    })
    win.removeMenu();
    win.maximize();
    win.loadURL(`file://${__dirname}/dist/electron-test/index.html`); // app packaging??
    
    // if (process.env.NODE_ENV==='prod') {
    // win.loadURL(`file://${__dirname}/dist/electron-test/index.html`);
    // } else {
    //         win.loadURL(`file://${__dirname}/index.html`);
    // }

     win.webContents.openDevTools(); // for testing
    win.on('closed', async () => {
        // saveLog('App Ended', appLog);
        win = null;
    })   
}

app.on('ready', createWindow);
app.on('ready', createDefaultSettings);
app.on('ready', getQueueData);
app.on('ready', () => {
    saveLog('App Started ', appLog);
})

//////////////////////////////////////////////////////////////////////////////**login *//////////////////////////////////////////////////////////////////////////////////////////
ipcMain.on('attemptLogin', (event, arg) => {
    let isAuth = false;
    if (arg.username === PRINTER_USER && arg.password === PRINTER_PASS) {
        isAuth = true;
    } else {
        isAuth = false;
    }
    event.reply('loginAnswer', isAuth);
});

ipcMain.on('loginEvent', (event, arg) => {
    isLoggedIn = arg.loginState;
});

ipcMain.on('isLoggedIn', (event, arg) => {
    event.reply('currentLoginState', isLoggedIn);
});
//////////////////////////////////////////////////////////////////////////////**login *//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////** directory *//////////////////////////////////////////////////////////////////////////////////////////
ipcMain.on('update-files', async (event, arg) => {        
    // const res = activatePrinterCron();
    const res = activateQueueCron();

    saveLog('printer update initiated', directoryLog);
    win.webContents.send('panel-cron-update', res);
});
ipcMain.on('update-panel-cron', async (event, arg) => {    
    const res = panelCronStopCheck(arg); // res would be panelCronFlag    
   event.reply('panel-cron-update', res);   
});

ipcMain.on('request-panel-cron', async (event, arg) => {    
   const res = getPanelFlag();
   event.reply('panel-cron-update', res);   
});

//////////////////////////////////////////////////////////////////////////////**Settings *//////////////////////////////////////////////////////////////////////////////////////////
ipcMain.on('request-file-directory', async (event, arg) => {
    const mongoCustomDir = await getSetting(printer_directory_setting);        
    const dirRes = {
        type: 'printer',
        value: mongoCustomDir ? mongoCustomDir.value : ''
    }
    event.reply('new-directory', dirRes);   
});

ipcMain.on('request-queue-directory', async (event, arg) => {
    const mongoCustomDir = await getSetting(printer_queue_setting);        
    const dirRes = {
        type: 'queue',
        value: mongoCustomDir ? mongoCustomDir.value : ''
    };
    event.reply('new-directory', dirRes);   
});

ipcMain.on('request-machine', async (event, arg) => {
    const res = getMachineName();
    event.reply('machine-name', res);   
});
ipcMain.on('update-file-directory', async (event, arg) => {
    const res = await updateFileDirectory(printer_directory_setting, arg);
    const newDir = res ? res.value: defaultDirectory;
    saveLog('Changed default print directory to ' + newDir, appLog);

    event.reply('new-file-directory', res ? res.value : '');   
});
//////////////////////////////////////////////////////////////////////////////**Settings *//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////**Other events *//////////////////////////////////////////////////////////////////////////////////////////

ipcMain.on('exit', (event, arg) => {
    win.close();
});
