const { ORDERSYNC_CHANNELS } = require('./channels')

const registerBootstrapIpcHandlers = ({ ipcMain, bootstrapOrchestrator }) => {
  ipcMain.handle(ORDERSYNC_CHANNELS.SHELL_GET_BOOTSTRAP_STATE, async () =>
    bootstrapOrchestrator.getBootstrapState()
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.SHELL_LOGIN, async (_event, payload) =>
    bootstrapOrchestrator.login(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.SHELL_LOGOUT, async () => bootstrapOrchestrator.logout())
  ipcMain.handle(ORDERSYNC_CHANNELS.SHELL_SELECT_TENANT, async (_event, tenantId) =>
    bootstrapOrchestrator.selectTenant(tenantId)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.SHELL_ENTER_WORKSPACE, async (_event, payload) =>
    bootstrapOrchestrator.enterWorkspace(payload)
  )
}

module.exports = {
  registerBootstrapIpcHandlers,
}
