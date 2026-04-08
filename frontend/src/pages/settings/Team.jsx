import { CheckCircle2, KeyRound, Pencil, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import InviteStaffModal from '@/components/InviteStaffModal'
import ResetPasswordModal from '@/components/ResetPasswordModal'
import SettingsNav from '@/components/SettingsNav'
import settingsService from '@/services/settingsService'

function Team() {
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [passwordStaff, setPasswordStaff] = useState(null)
  const [banner, setBanner] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true)
        const response = await settingsService.getStaff()
        setStaff(response.data.staff)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load team members.')
      } finally {
        setLoading(false)
      }
    }

    loadStaff()
  }, [])

  const handleDelete = async (member) => {
    try {
      await settingsService.deleteStaff(member.id)
      setStaff((current) => current.filter((item) => item.id !== member.id))
      setBanner('Team member deleted successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete team member.')
    }
  }

  return (
    <div className="space-y-6">
      <SettingsNav />

      <section className="flex flex-col gap-5 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Premium collaboration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Team Management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Invite admins and staff members, then manage access under the same business workspace.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700" onClick={() => setIsModalOpen(true)} type="button">
          <UserPlus className="h-4 w-4" />
          Invite Staff
        </button>
      </section>

      {banner ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}

      <section className="rounded-[28px] border border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Business users</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All accounts linked to this tenant workspace.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{staff.length} members</div>
        </div>

        {loading ? (
          <div className="space-y-3 px-6 py-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid animate-pulse gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : staff.length ? (
          <div className="overflow-x-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/80">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950/80">
                  {staff.map((member) => (
                    <tr key={member.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{member.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${member.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/20' : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Intl.DateTimeFormat('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(member.createdAt))}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white" onClick={() => { setEditingStaff(member); setIsModalOpen(true) }} type="button"><Pencil className="h-4 w-4" /></button>
                          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white" onClick={() => setPasswordStaff(member)} type="button"><KeyRound className="h-4 w-4" /></button>
                          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-200" onClick={() => handleDelete(member)} type="button"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-sky-500/10 dark:text-sky-200"><Users className="h-7 w-7" /></div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">No team members yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Invite staff so your business can collaborate under the same tenant securely.</p>
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-950 dark:text-white">Permission model</p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Staff users can operate day-to-day workflows, but they are restricted from Reports and Settings pages. Admins retain full workspace visibility and configuration access.
            </p>
          </div>
        </div>
      </section>

      <InviteStaffModal
        onClose={() => {
          setIsModalOpen(false)
          setEditingStaff(null)
        }}
        onSuccess={(user, message) => {
          setStaff((current) => {
            const exists = current.some((item) => item.id === user.id)
            return exists ? current.map((item) => (item.id === user.id ? user : item)) : [user, ...current]
          })
          setBanner(message)
        }}
        staffMember={editingStaff}
        open={isModalOpen}
      />

      <ResetPasswordModal onClose={() => setPasswordStaff(null)} onSuccess={(message) => setBanner(message)} open={Boolean(passwordStaff)} staffMember={passwordStaff} />
    </div>
  )
}

export default Team
