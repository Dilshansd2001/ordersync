const { ORDERSYNC_CHANNELS } = require('./channels')

const registerAuthIpcHandlers = ({ ipcMain, authSessionService }) => {
  ipcMain.handle(ORDERSYNC_CHANNELS.AUTH_BOOTSTRAP, async () => authSessionService.bootstrap())
  ipcMain.handle(ORDERSYNC_CHANNELS.AUTH_LOGIN, async (_event, payload) =>
    authSessionService.login(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.AUTH_LOGOUT, async () => authSessionService.logout())
  ipcMain.handle(ORDERSYNC_CHANNELS.AUTH_GET_SESSION_STATUS, async () =>
    authSessionService.getSessionStatus()
  )
}

module.exports = {
  registerAuthIpcHandlers,
}
