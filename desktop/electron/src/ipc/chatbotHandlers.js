const registerChatbotIpcHandlers = ({ ipcMain, chatbotService, channels }) => {
  ipcMain.handle(channels.CHATBOT_ASK, async (_event, payload) => chatbotService.ask(payload))
}

module.exports = {
  registerChatbotIpcHandlers,
}
