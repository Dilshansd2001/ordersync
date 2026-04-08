import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  LoaderCircle,
  MessageCircleMore,
  SendHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import chatbotService from '@/services/chatbotService'
import chatbotActionService from '@/services/chatbotActionService'

const INITIAL_SUGGESTIONS = [
  'Show today\'s order summary',
  'Which products are low in stock?',
  'Desktop sync status eka mokakda?',
]

const createWelcomeMessage = (businessName) => ({
  id: 'welcome',
  role: 'assistant',
  content: `Hi! I can help with ${businessName || 'your workspace'} in Sinhala or English. I can also prepare safe actions like adding customers, products, expenses, or triggering desktop sync after your confirmation.`,
})

const formatCurrentView = (pathname) => {
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] || 'dashboard'

  return lastSegment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ChatbotWidget() {
  const location = useLocation()
  const { business } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState(() => [createWelcomeMessage(business?.name)])
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS)
  const [runningActionId, setRunningActionId] = useState(null)
  const viewportRef = useRef(null)

  useEffect(() => {
    setMessages([createWelcomeMessage(business?.name)])
  }, [business?.name])

  useEffect(() => {
    if (!viewportRef.current) {
      return
    }

    viewportRef.current.scrollTop = viewportRef.current.scrollHeight
  }, [messages, isOpen])

  const submitMessage = async (rawMessage) => {
    const message = rawMessage.trim()

    if (!message || isSending) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setDraft('')
    setIsSending(true)

    try {
      const response = await chatbotService.sendChatMessage({
        message,
        history: nextMessages,
        context: {
          businessName: business?.name || 'OrderSync.lk',
          currentView: formatCurrentView(location.pathname),
        },
      })

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content:
            response?.reply ||
            'I could not prepare an answer just now. Please try again in a moment.',
          actionProposal: response?.actionProposal || null,
          actionState: response?.actionProposal ? 'pending' : null,
        },
      ])

      if (Array.isArray(response?.suggestions) && response.suggestions.length) {
        setSuggestions(response.suggestions)
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            error?.message ||
            'Chatbot is unavailable right now. Check your connection and backend configuration.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const updateMessageActionState = (messageId, patch) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              ...patch,
            }
          : message,
      ),
    )
  }

  const handleConfirmAction = async (messageId, actionProposal) => {
    setRunningActionId(messageId)
    updateMessageActionState(messageId, { actionState: 'running' })

    try {
      await chatbotActionService.executeChatbotAction(actionProposal)
      updateMessageActionState(messageId, { actionState: 'completed' })
      setMessages((current) => [
        ...current,
        {
          id: `assistant-result-${Date.now()}`,
          role: 'assistant',
          content: `Done. ${actionProposal.summary}`,
        },
      ])
    } catch (error) {
      updateMessageActionState(messageId, {
        actionState: 'failed',
        actionError: error?.message || 'Action failed.',
      })
      setMessages((current) => [
        ...current,
        {
          id: `assistant-result-${Date.now()}`,
          role: 'assistant',
          content: error?.message || 'Action failed.',
        },
      ])
    } finally {
      setRunningActionId(null)
    }
  }

  const handleCancelAction = (messageId) => {
    updateMessageActionState(messageId, { actionState: 'cancelled' })
    setMessages((current) => [
      ...current,
      {
        id: `assistant-cancel-${Date.now()}`,
        role: 'assistant',
        content: 'Action cancelled. If you want, I can prepare a different change.',
      },
    ])
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {isOpen ? (
          <section className="w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[30px] border border-white/60 bg-white/90 shadow-2xl shadow-slate-950/15 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 dark:shadow-black/30">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_42%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_36%),linear-gradient(135deg,#082032_0%,#111c3d_45%,#19244d_100%)] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    ODERSYNC AI ASSISTANT
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">Workspace assistant</h2>
                  <p className="mt-1 text-sm text-slate-200">
                    Ask in Sinhala or English. I&apos;ll answer from your current workspace data.
                  </p>
                </div>

                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10 dark:hover:text-sky-100"
                    onClick={() => submitMessage(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={viewportRef}
              className="max-h-[420px] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(241,245,249,0.8))] px-4 py-4 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.7),rgba(15,23,42,0.92))]"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[85%]">
                    <div
                    className={`rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === 'user'
                        ? 'rounded-br-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white'
                        : 'rounded-bl-xl border border-white/60 bg-white/90 text-slate-700 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100'
                    }`}
                  >
                    {message.content}
                    </div>
                    {message.actionProposal ? (
                      <div className="mt-3 rounded-[24px] border border-sky-100 bg-sky-50/90 p-4 text-sm text-slate-700 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-slate-100">
                        <p className="font-semibold text-slate-900 dark:text-white">{message.actionProposal.title}</p>
                        <p className="mt-1 leading-6">{message.actionProposal.confirmationMessage}</p>
                        <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">
                          {message.actionProposal.summary}
                        </div>
                        {message.actionError ? (
                          <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-300">
                            {message.actionError}
                          </p>
                        ) : null}
                        <div className="mt-4 flex gap-2">
                          <button
                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={message.actionState !== 'pending' || runningActionId === message.id}
                            onClick={() => handleConfirmAction(message.id, message.actionProposal)}
                            type="button"
                          >
                            {message.actionState === 'running' ? 'Running...' : 'Confirm'}
                          </button>
                          <button
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            disabled={message.actionState !== 'pending' || runningActionId === message.id}
                            onClick={() => handleCancelAction(message.id)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                        {message.actionState === 'completed' ? (
                          <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                            Action completed.
                          </p>
                        ) : null}
                        {message.actionState === 'cancelled' ? (
                          <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Action cancelled.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {isSending ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-3xl rounded-bl-xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Thinking with your workspace context...
                  </div>
                </div>
              ) : null}
            </div>

            <form
              className="border-t border-slate-200/80 bg-white/85 p-4 dark:border-slate-800 dark:bg-slate-950/90"
              onSubmit={(event) => {
                event.preventDefault()
                submitMessage(draft)
              }}
            >
              <div className="flex items-end gap-3">
                <label className="flex-1">
                  <span className="sr-only">Ask OrderSync Copilot</span>
                  <textarea
                    className="min-h-[92px] w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        submitMessage(draft)
                      }
                    }}
                    placeholder="Ask about orders, revenue, stock, or sync..."
                    value={draft}
                  />
                </label>
                <button
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!draft.trim() || isSending}
                  type="submit"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <button
          className="group inline-flex h-16 items-center gap-3 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 px-5 text-white shadow-2xl shadow-sky-500/25 transition hover:-translate-y-0.5"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/18">
            {isOpen ? <X className="h-5 w-5" /> : <MessageCircleMore className="h-5 w-5" />}
          </span>
          <span className="hidden pr-1 text-left sm:block">
                  <span className="block text-sm font-semibold">ODERSYNC AI ASSISTANT</span>
            <span className="block text-xs text-white/80">Sinhala + English</span>
          </span>
          {!isOpen ? <Bot className="hidden h-4 w-4 text-cyan-100 sm:block" /> : null}
        </button>
      </div>
    </>
  )
}

export default ChatbotWidget
