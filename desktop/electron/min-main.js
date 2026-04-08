const path = require('node:path')
const fs = require('node:fs')
const { app, BrowserWindow } = require('electron')

const DESKTOP_APP_NAME = 'OrderSync.lk'

app.setName(DESKTOP_APP_NAME)

if (process.platform === 'win32' && typeof app.setAppUserModelId === 'function') {
  app.setAppUserModelId('lk.ordersync.desktop')
}

const getWindowIconPath = () => {
  const candidatePaths = [
    path.join(__dirname, '../../build-assets/icon.ico'),
    path.join(__dirname, '../../build-assets/icon-preview.png'),
  ]

  return candidatePaths.find((iconPath) => fs.existsSync(iconPath))
}

app.whenReady().then(() => {
  const window = new BrowserWindow({
    title: DESKTOP_APP_NAME,
    width: 800,
    height: 600,
    icon: getWindowIconPath(),
  })

  window.loadURL('data:text/html,<h1>Electron Boot OK</h1>')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
