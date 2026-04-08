import { LoaderCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import settingsService from '@/services/settingsService'

function ResetPasswordModal({ open, onClose, onSuccess, staffMember }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)
      await settingsService.resetStaffPassword(staffMember.id, password)
      onSuccess?.('Password reset successfully.')
      handleClose()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !staffMember) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={handleClose} type="button" />
      <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-500">Security</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Reset staff password</h2>
          </div>
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" onClick={handleClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-500">Set a new password for <span className="font-medium text-slate-900">{staffMember.name}</span>.</p>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" onChange={(event) => setPassword(event.target.value)} placeholder="New password" type="password" value={password} />
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={handleClose} type="button">Cancel</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-70" disabled={loading} type="submit">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordModal
