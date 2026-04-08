const path = require('node:path')
const fs = require('node:fs')
const { app, BrowserWindow, ipcMain, Menu, net, shell } = require('electron')
const { registerAuthIpcHandlers } = require('./src/ipc/authHandlers')
const { registerBootstrapIpcHandlers } = require('./src/ipc/bootstrapHandlers')
const { registerChatbotIpcHandlers } = require('./src/ipc/chatbotHandlers')
const { registerOrdersyncIpcHandlers } = require('./src/ipc/ordersyncHandlers')
const { ORDERSYNC_CHANNELS } = require('./src/ipc/channels')
const { BootstrapOrchestrator } = require('./src/services/BootstrapOrchestrator')
const { AuthSessionService } = require('./src/services/AuthSessionService')
const { ChatbotBridgeService } = require('./src/services/ChatbotBridgeService')
const { DesktopLogger } = require('./src/services/DesktopLogger')
const { OrderSyncDesktopService } = require('./src/services/OrderSyncDesktopService')
const { SecureSessionStore } = require('./src/services/SecureSessionStore')
const { SubscriptionService } = require('./src/services/SubscriptionService')
const { TenantContextService } = require('./src/services/TenantContextService')

const windows = new Set()
let autoUpdater = null
const DESKTOP_APP_NAME = 'OrderSync.lk'
const PRODUCTION_SYNC_API_URL = 'https://ordersync-yxm7.onrender.com/api'
const DEVELOPMENT_SYNC_API_URL = 'http://localhost:5000/api'

app.setName(DESKTOP_APP_NAME)

if (process.platform === 'win32' && typeof app.setAppUserModelId === 'function') {
  app.setAppUserModelId('lk.ordersync.desktop')
}

const getFrontendUrl = () =>
  process.env.ELECTRON_RENDERER_URL || `file://${path.join(__dirname, '../../frontend/dist/index.html')}`

const getSyncApiBaseUrl = () => {
  if (process.env.ORDERSYNC_SYNC_API_URL) {
    return process.env.ORDERSYNC_SYNC_API_URL
  }

  return app.isPackaged ? PRODUCTION_SYNC_API_URL : DEVELOPMENT_SYNC_API_URL
}

const isSafeExternalUrl = (targetUrl) =>
  typeof targetUrl === 'string' &&
  (targetUrl.startsWith('https://') || targetUrl.startsWith('http://') || targetUrl.startsWith('mailto:'))

const getWindowIconPath = () => {
  const candidatePaths = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'build-assets', 'icon.ico'),
        path.join(process.resourcesPath, 'build-assets', 'icon-preview.png'),
      ]
    : [
        path.join(__dirname, '../../build-assets/icon.ico'),
        path.join(__dirname, '../../build-assets/icon-preview.png'),
      ]

  return candidatePaths.find((iconPath) => fs.existsSync(iconPath))
}

const createWindow = async () => {
  const window = new BrowserWindow({
    title: DESKTOP_APP_NAME,
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    autoHideMenuBar: true,
    backgroundColor: '#081120',
    icon: getWindowIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  windows.add(window)
  window.on('closed', () => {
    windows.delete(window)
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }

    return { action: 'allow' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    if (isSafeExternalUrl(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  const frontendUrl = getFrontendUrl()
  if (frontendUrl.startsWith('file://')) {
    await window.loadURL(frontendUrl)
  } else {
    await window.loadURL(frontendUrl)
  }

  return window
}

const broadcastSyncStatus = (payload) => {
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send(ORDERSYNC_CHANNELS.SYNC_STATUS_EVENT, payload)
    }
  }
}

const broadcastAuthStatus = (payload) => {
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send(ORDERSYNC_CHANNELS.AUTH_STATUS_EVENT, payload)
    }
  }
}

const isOnline = () => {
  try {
    return typeof net.isOnline === 'function' ? net.isOnline() : true
  } catch (error) {
    return true
  }
}

const configureAutoUpdates = () => {
  if (!app.isPackaged || process.env.ELECTRON_DISABLE_UPDATES === 'true') {
    return
  }

  if (!autoUpdater) {
    ;({ autoUpdater } = require('electron-updater'))
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] Update available.', info?.version || 'unknown')
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] No updates available.')
  })

  autoUpdater.on('error', (error) => {
    console.error('[updater] Auto-update error:', error?.message || error)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[updater] Update downloaded. Installing now.', info?.version || 'unknown')
    autoUpdater.quitAndInstall()
  })
}

const createAuthSessionService = () => {
  const secureStore = new SecureSessionStore({
    userDataDir: app.getPath('userData'),
    appNamespace: 'ordersync-pos',
    allowInsecureFallback: process.env.NODE_ENV !== 'production',
  })

  return new AuthSessionService({
    apiBaseUrl: getSyncApiBaseUrl(),
    secureStore,
    isOnline,
  })
}

const createDesktopService = (authSessionService) =>
  new OrderSyncDesktopService({
    baseDbDir: path.join(app.getPath('userData'), 'tenant-dbs'),
    syncApiBaseUrl: getSyncApiBaseUrl(),
    getAuthHeaders: async () => authSessionService.getAuthHeaders(),
    resolveActiveTenantContext: async () => authSessionService.resolveTenantContext(),
    isOnline,
    logger: new DesktopLogger({
      logDir: path.join(app.getPath('userData'), 'logs'),
    }),
  })

const createChatbotService = (authSessionService) =>
  new ChatbotBridgeService({
    apiBaseUrl: getSyncApiBaseUrl(),
    getAuthHeaders: async () => authSessionService.getAuthHeaders(),
    isOnline,
  })

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  configureAutoUpdates()
  const authSessionService = createAuthSessionService()
  const desktopService = createDesktopService(authSessionService)
  const chatbotService = createChatbotService(authSessionService)
  const tenantContextService = new TenantContextService({ authSessionService })
  const subscriptionService = new SubscriptionService({
    authSessionService,
    isOnline,
  })
  const bootstrapOrchestrator = new BootstrapOrchestrator({
    authSessionService,
    tenantContextService,
    subscriptionService,
    desktopService,
    appVersion: app.getVersion(),
  })

  authSessionService.on('auth-status', broadcastAuthStatus)
  desktopService.on('sync-status', broadcastSyncStatus)

  registerBootstrapIpcHandlers({
    ipcMain,
    bootstrapOrchestrator,
  })

  registerAuthIpcHandlers({
    ipcMain,
    authSessionService,
  })

  registerOrdersyncIpcHandlers({
    ipcMain,
    desktopService,
  })

  registerChatbotIpcHandlers({
    ipcMain,
    chatbotService,
    channels: ORDERSYNC_CHANNELS,
  })

  await createWindow()

  if (app.isPackaged && process.env.ELECTRON_DISABLE_UPDATES !== 'true') {
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      console.error('[updater] Failed to check for updates:', error?.message || error)
    })
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
