import { app, protocol, BrowserWindow, ipcMain, Tray, nativeImage, Menu, globalShortcut, screen, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
import path from 'path'
const child_process = require('child_process')
const Store = require('electron-store')
const store = new Store()
const screenshot = require('screenshot-desktop')

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
])

let mainWindow = null
let tray = null
async function createMainWindow() {
    // 禁止程序多开
    if (!app.requestSingleInstanceLock()) {
        app.quit()
        return
    }

    const { width, height } = screen.getPrimaryDisplay().size
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        frame: false,
        fullscreen: process.platform != 'darwin', // 控制窗口全屏，注意在 mac 下全屏会跳到另一个桌面，因此 mac 下不能使用该属性
        x: 0,
        y: 0,
        transparent: true,
        resizable: false,
        movable: false,
        show: false,
        autoHideMenuBar: true,
        enableLargerThanScreen: true, //mac
        skipTaskbar: true,
        alwaysOnTop: true,
        hasShadow: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setFullScreenable(false)
    // mainWindow.setVisibleOnAllWorkspaces(true)
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
        createProtocol('app')
        mainWindow.loadURL('app://./index.html')
    }
}

function createTray() {
    tray = new Tray(nativeImage.createFromPath(path.join(__static + '/trayTemplate.png')))
    tray.setContextMenu(setContextMenu())
}

function setContextMenu() {
    let launch = store.get('launch') || false
    store.set('launch', launch)
    let tolerance = store.get('tolerance') || 'Medium'
    let unit = store.get('unit') || 'px'

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Measure Dimensions',
            accelerator: 'Shift+CmdOrCtrl+F',
            click: () => {
                screencapture()
            }
        },
        { type: 'separator' },
        {
            label: 'Default Unit',
            submenu: [
                {
                    label: 'px',
                    type: 'checkbox',
                    checked: unit === 'px',
                    click: () => {
                        store.set('unit', 'px')
                        tray.setContextMenu(setContextMenu())
                    }
                },
                {
                    label: 'rem',
                    type: 'checkbox',
                    checked: unit === 'rem',
                    click: () => {
                        store.set('unit', 'rem')
                        tray.setContextMenu(setContextMenu())
                    }
                }
            ]
        },
        { type: 'separator' },
        {
            label: 'Color Picker',
            accelerator: 'Shift+CmdOrCtrl+A',
            click: () => {
                colorPicker()
            }
        },
        // { type: 'separator' },
        // {
        //     label: 'Default Tolerance',
        //     submenu: [
        //         {
        //             label: 'Zero',
        //             type: 'checkbox',
        //             checked: tolerance === 'Zero',
        //             click: () => {
        //                 store.set('tolerance', 'Zero')
        //                 tray.setContextMenu(setContextMenu())
        //             }
        //         },
        //         {
        //             label: 'Low',
        //             type: 'checkbox',
        //             checked: tolerance === 'Low',
        //             click: () => {
        //                 store.set('tolerance', 'Low')
        //                 tray.setContextMenu(setContextMenu())
        //             }
        //         },
        //         {
        //             label: 'Medium',
        //             type: 'checkbox',
        //             checked: tolerance === 'Medium',
        //             click: () => {
        //                 store.set('tolerance', 'Medium')
        //                 tray.setContextMenu(setContextMenu())
        //             }
        //         },
        //         {
        //             label: 'High',
        //             type: 'checkbox',
        //             checked: tolerance === 'High',
        //             click: () => {
        //                 store.set('tolerance', 'High')
        //                 tray.setContextMenu(setContextMenu())
        //             }
        //         }
        //     ]
        // },
        { type: 'separator' },
        {
            label: 'launch at Login',
            type: 'checkbox',
            checked: launch,
            click: () => {
                let launch = store.get('launch')
                store.set('launch', !launch)
                if (!launch) {
                    app.setLoginItemSettings({
                        openAtLogin: true
                    })
                } else {
                    app.setLoginItemSettings({
                        openAtLogin: false
                    })
                }
            }
        },
        { type: 'separator' },
        {
            label: 'About Ruler',
            click: () => {
                aboutWindow.show()
            }
        },
        { type: 'separator' },
        {
            label: 'Quit Ruler',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
                quitFlag = true
                app.quit()
            }
        }
    ])
    return contextMenu
}

let resourcesPath = process.resourcesPath
if (process.platform == 'darwin') {
    resourcesPath = resourcesPath.replace('node_modules/electron/dist/Electron.app/Contents/Resources', '')
} else if (process.platform == 'win32') {
    resourcesPath = resourcesPath.replace('node_modules\\electron\\dist\\resources', '')
} else {
    resourcesPath = resourcesPath.replace('node_modules/electron/dist/Electron.app/Contents/Resources', '')
}

function screencapture() {
    let license = store.get('license') || false
    if (license) {
        globalShortcut.register('Esc', () => {
            mainWindow.hide()
            globalShortcut.unregister('Esc')
        })
        if (process.platform == 'darwin') {
            child_process.exec(`screencapture -x "${resourcesPath}/capture.png"`, error => {
                if (!error) {
                    mainWindow.show()
                    mainWindow.webContents.send('recognize', `${resourcesPath}/capture.png`)
                }
            })
        } else {
            screenshot({ filename: `${resourcesPath}/capture.png` }).then(result => {
                mainWindow.show()
                mainWindow.webContents.send('recognize', result)
            })
        }
    } else {
        createLicenseWindow()
    }
}

function colorPicker() {
    let license = store.get('license') || false
    if (license) {
        globalShortcut.register('Esc', () => {
            mainWindow.hide()
            globalShortcut.unregister('Esc')
        })
        if (process.platform == 'darwin') {
            child_process.exec(`screencapture -x "${resourcesPath}/capture.png"`, error => {
                if (!error) {
                    mainWindow.show()
                    mainWindow.webContents.send('colorPicker', `${resourcesPath}/capture.png`)
                }
            })
        } else {
            screenshot({ filename: `${resourcesPath}/capture.png` }).then(result => {
                mainWindow.show()
                mainWindow.webContents.send('colorPicker', result)
            })
        }
    } else {
        createLicenseWindow()
    }
}

let licenseWindow = null
async function createLicenseWindow() {
    licenseWindow = new BrowserWindow({
        title: 'Activate License',
        width: 480,
        height: 180,
        resizable: false,
        maximizable: true,
        autoHideMenuBar: true,
        useContentSize: true,
        backgroundColor: '#f0eff4',
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await licenseWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/license')
    } else {
        licenseWindow.loadURL('app://./index.html#/license')
    }
}

let aboutWindow = null
let quitFlag = false
async function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: 'About',
        width: 453,
        height: 300,
        show: false,
        resizable: false,
        maximizable: true,
        autoHideMenuBar: true,
        backgroundColor: '#f5f0ec',
        useContentSize: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    aboutWindow.on('close', event => {
        if (!quitFlag) {
            event.preventDefault()
            aboutWindow.hide()
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await aboutWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/about')
    } else {
        aboutWindow.loadURL('app://./index.html#/about')
    }
}

ipcMain.handle('closeLicense', async (event, args) => {
    if (licenseWindow != null) {
        licenseWindow.close()
    }
})

ipcMain.handle('openExternal', async (event, url) => {
    shell.openExternal(url)
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})

app.on('ready', async () => {
    if (process.platform == 'darwin') {
        app.dock.hide()
    }
    await createMainWindow()
    createTray()
    globalShortcut.register('CmdOrCtrl+Q', () => {
        quitFlag = true
        app.quit()
    })
    globalShortcut.register('Shift+CmdOrCtrl+F', () => {
        screencapture()
    })
    globalShortcut.register('Shift+CmdOrCtrl+A', () => {
        colorPicker()
    })
    await createAboutWindow()
})

if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', data => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

if (app.isPackaged) {
    let launch = store.get('launch') || false
    if (launch) {
        app.setLoginItemSettings({
            openAtLogin: true
        })
    }
}
