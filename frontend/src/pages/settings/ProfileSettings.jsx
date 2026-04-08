import { CheckCircle2, ImagePlus, LockKeyhole, Store, UserCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SettingsNav from '@/components/SettingsNav'
import { setBusiness, setUser } from '@/features/authSlice'
import settingsService from '@/services/settingsService'
import userService from '@/services/userService'

function ProfileSettings() {
  const dispatch = useDispatch()
  const { business, user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileBanner, setProfileBanner] = useState('')
  const [brandingBanner, setBrandingBanner] = useState('')
  const [passwordBanner, setPasswordBanner] = useState('')
  const [profileError, setProfileError] = useState('')
  const [brandingError, setBrandingError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    workspace: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [brandingForm, setBrandingForm] = useState({
    name: '',
    tagline: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await settingsService.getProfileSettings()
        const businessProfile = response.data?.business

        setBrandingForm({
          name: businessProfile?.name || '',
          tagline: businessProfile?.tagline || '',
          email: businessProfile?.email || '',
          phone: businessProfile?.phone || '',
          address: businessProfile?.address || '',
          logo: businessProfile?.logo || '',
        })

        setProfileForm({
          name: user?.name || '',
          email: user?.email || '',
          workspace: businessProfile?.name || business?.name || '',
        })
      } catch (requestError) {
        const message = requestError.response?.data?.message || 'Failed to load profile settings.'
        setBrandingError(message)
        setProfileError(message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [business?.name, user?.email, user?.name])

  const initials = useMemo(() => {
    const source = profileForm.name || user?.name || business?.name || 'OS'

    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [business?.name, profileForm.name, user?.name])

  const previewLogo =
    brandingForm.logo instanceof File ? URL.createObjectURL(brandingForm.logo) : brandingForm.logo || business?.logo

  const updateProfileField = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
    setProfileBanner('')
    setProfileError('')
  }

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
    setPasswordBanner('')
    setPasswordError('')
  }

  const updateBrandingField = (field, value) => {
    setBrandingForm((current) => ({ ...current, [field]: value }))
    setBrandingBanner('')
    setBrandingError('')
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    updateBrandingField('logo', file)
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()

    try {
      setProfileSaving(true)
      const response = await userService.updateUserProfile({
        name: profileForm.name,
        email: profileForm.email,
        workspace: profileForm.workspace,
      })
      const updatedUser = response.data?.user
      const updatedBusiness = response.data?.business

      if (updatedUser) {
        dispatch(setUser(updatedUser))
      }

      if (updatedBusiness) {
        dispatch(setBusiness(updatedBusiness))
        setBrandingForm((current) => ({ ...current, name: updatedBusiness.name || current.name }))
      }

      setProfileBanner(response.message || 'Profile updated successfully.')
    } catch (requestError) {
      setProfileError(requestError.response?.data?.message || 'Unable to save your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    try {
      setPasswordSaving(true)
      const response = await userService.updateUserProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      setPasswordBanner(response.message || 'Password updated successfully.')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || 'Unable to update your password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleBrandingSubmit = async (event) => {
    event.preventDefault()

    try {
      setBrandingSaving(true)
      const formData = new FormData()
      formData.append('name', brandingForm.name)
      formData.append('tagline', brandingForm.tagline)
      formData.append('email', brandingForm.email)
      formData.append('phone', brandingForm.phone)
      formData.append('address', brandingForm.address)

      if (typeof brandingForm.logo === 'string') {
        formData.append('logo', brandingForm.logo)
      } else if (brandingForm.logo) {
        formData.append('logo', brandingForm.logo)
      }

      const response = await settingsService.updateProfileSettings(formData)
      const updatedBusiness = response.data?.business

      if (updatedBusiness) {
        dispatch(setBusiness(updatedBusiness))
        setProfileForm((current) => ({ ...current, workspace: updatedBusiness.name || current.workspace }))
        setBrandingForm((current) => ({
          ...current,
          name: updatedBusiness.name || current.name,
          tagline: updatedBusiness.tagline || current.tagline,
          email: updatedBusiness.email || current.email,
          phone: updatedBusiness.phone || current.phone,
          address: updatedBusiness.address || current.address,
          logo: updatedBusiness.logo || '',
        }))
      }

      setBrandingBanner(response.message || 'Business profile updated successfully.')
    } catch (requestError) {
      setBrandingError(requestError.response?.data?.message || 'Unable to save business profile.')
    } finally {
      setBrandingSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsNav />

      <section className="rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/75 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6 rounded-[28px] border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-col items-center text-center">
              {previewLogo ? (
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:shadow-none">
                  <img alt="Workspace logo" className="h-full w-full object-cover" src={previewLogo} />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white shadow-lg shadow-indigo-500/20">
                  {initials || 'OS'}
                </div>
              )}
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {profileForm.name || 'Workspace Owner'}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {profileForm.workspace || business?.name || 'OrderSync Workspace'}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profileForm.email || user?.email}</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/80">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Account overview</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200">
                    <UserCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.role || 'ADMIN'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Current access level</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200">
                    <Store className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {business?.subscriptionPlan || 'Workspace active'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Plan or workspace status</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Profile settings</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Manage your account details
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Update your personal information, workspace display name, and secure your account from one place.
              </p>
            </div>

            <form
              className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8"
              onSubmit={handleProfileSubmit}
            >
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">General information</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  These details appear across your workspace and account menu.
                </p>
              </div>

              {profileBanner ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{profileBanner}</span>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                    onChange={(event) => updateProfileField('name', event.target.value)}
                    required
                    value={profileForm.name}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                    onChange={(event) => updateProfileField('email', event.target.value)}
                    required
                    type="email"
                    value={profileForm.email}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Workspace name</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                    onChange={(event) => updateProfileField('workspace', event.target.value)}
                    value={profileForm.workspace}
                  />
                </label>
              </div>

              {profileError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {profileError}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-70"
                  disabled={loading || profileSaving}
                  type="submit"
                >
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>

            <form
              className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8"
              onSubmit={handlePasswordSubmit}
            >
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Security</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Change your password using your current credentials for confirmation.
                </p>
              </div>

              {passwordBanner ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{passwordBanner}</span>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Current password</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                    onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                    required
                    type="password"
                    value={passwordForm.currentPassword}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New password</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                    minLength={8}
                    onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                    required
                    type="password"
                    value={passwordForm.newPassword}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                    minLength={8}
                    onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                    required
                    type="password"
                    value={passwordForm.confirmPassword}
                  />
                </label>
              </div>

              {passwordError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {passwordError}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  disabled={passwordSaving}
                  type="submit"
                >
                  <LockKeyhole className="h-4 w-4" />
                  {passwordSaving ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <form
                className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8"
                onSubmit={handleBrandingSubmit}
              >
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Brand settings</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Workspace identity</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Fine-tune the public-facing business details shown on invoices and customer touchpoints.
                  </p>
                </div>

                {brandingBanner ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{brandingBanner}</span>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Business name</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                      onChange={(event) => updateBrandingField('name', event.target.value)}
                      value={brandingForm.name}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tagline</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                      onChange={(event) => updateBrandingField('tagline', event.target.value)}
                      value={brandingForm.tagline}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Business email</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                      onChange={(event) => updateBrandingField('email', event.target.value)}
                      type="email"
                      value={brandingForm.email}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                      onChange={(event) => updateBrandingField('phone', event.target.value)}
                      value={brandingForm.phone}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</span>
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
                      onChange={(event) => updateBrandingField('address', event.target.value)}
                      value={brandingForm.address}
                    />
                  </label>
                </div>

                {brandingError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {brandingError}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <button
                    className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-70"
                    disabled={loading || brandingSaving}
                    type="submit"
                  >
                    {brandingSaving ? 'Saving...' : 'Save branding'}
                  </button>
                </div>
              </form>

              <aside className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Logo Upload</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Brand assets</h3>
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10">
                  {brandingForm.logo ? (
                    <img alt="Business logo" className="mb-4 h-20 w-20 rounded-3xl object-cover" src={previewLogo} />
                  ) : (
                    <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200">
                      <ImagePlus className="h-8 w-8" />
                    </span>
                  )}
                  <span className="text-base font-semibold text-slate-900 dark:text-white">Upload business logo</span>
                  <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">PNG, JPG, or SVG for workspace identity.</span>
                  <input accept="image/*" className="hidden" onChange={handleLogoUpload} type="file" />
                </label>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200">
                      {brandingForm.logo || business?.logo ? (
                        <img alt="Workspace logo" className="h-12 w-12 rounded-2xl object-cover" src={previewLogo} />
                      ) : (
                        <Store className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-slate-950 dark:text-white">
                        {brandingForm.name || business?.name || 'OrderSync.lk'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {brandingForm.tagline || 'Your business identity preview'}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProfileSettings
