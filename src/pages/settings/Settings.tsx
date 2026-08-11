import { useEffect, useState, useRef } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Building2, LockKeyhole, Trash2, Upload, Users } from 'lucide-react'
import { useToast, Button, Card, Alert } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { FormField, Input, Select, Textarea } from '../../components/forms'
import { companyApi, brandingApi } from '../../services/company.api'
import { userApi } from '../../services/user.api'
import { authApi } from '../../services/auth.api'
import type { Company, Branding } from '../../types/product.types'
import type { ApiError } from '../../types/auth.types'

type SettingsTab = 'company' | 'users' | 'theme' | 'password'

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const isValidHex = (value: string) => /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value)

const hexToRgba = (hex: string) => {
  if (!hex.startsWith('#')) return hex
  const normalized = hex.replace('#', '')
  let r = 0, g = 0, b = 0, a = 1
  if (normalized.length === 3 || normalized.length === 4) {
    r = parseInt(normalized[0] + normalized[0], 16)
    g = parseInt(normalized[1] + normalized[1], 16)
    b = parseInt(normalized[2] + normalized[2], 16)
    if (normalized.length === 4) a = parseInt(normalized[3] + normalized[3], 16) / 255
  } else if (normalized.length === 6 || normalized.length === 8) {
    r = parseInt(normalized.slice(0, 2), 16)
    g = parseInt(normalized.slice(2, 4), 16)
    b = parseInt(normalized.slice(4, 6), 16)
    if (normalized.length === 8) a = parseInt(normalized.slice(6, 8), 16) / 255
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export const Settings = () => {
  const { toast } = useToast()
  const { user } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [branding, setBranding] = useState<Branding | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('company')

  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '#000000',
    secondaryColor: '#000000',
    accentColor: '#000000',
    logo: null as File | null,
    background: null as File | null,
    favicon: null as File | null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bgPreview, setBgPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const logoRef = useRef<string | null>(null)
  const bgRef = useRef<string | null>(null)
  const faviconRef = useRef<string | null>(null)

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'WORKER' as 'MANAGER' | 'WORKER', mobile: '', dob: '', gender: 'OTHER', address: '' })
  const [userFiles, setUserFiles] = useState<{ photo?: File; signature?: File; pan?: File; aadhaar?: File }>({})
  const [userError, setUserError] = useState('')

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    return () => {
      if (logoRef.current) URL.revokeObjectURL(logoRef.current)
      if (bgRef.current) URL.revokeObjectURL(bgRef.current)
      if (faviconRef.current) URL.revokeObjectURL(faviconRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      try {
        const profileData = await companyApi.getProfile()
        if (!cancelled) {
          setCompany(profileData.company)
        }
      } catch (err) {
        toast({ title: 'Failed to load settings', description: (err as Error).message, variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [toast])

  const loadBranding = async () => {
    try {
      const data = await brandingApi.get()
      setBranding(data)
      setBrandingForm((f) => ({
        ...f,
        primaryColor: data.primaryColor || '#000000',
        secondaryColor: data.secondaryColor || '#000000',
        accentColor: data.accentColor || '#000000',
      }))
      if (data.logo) {
        if (logoRef.current) URL.revokeObjectURL(logoRef.current)
        const url = data.logo.startsWith('http') ? data.logo : `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')}${data.logo}`
        setLogoPreview(url)
        logoRef.current = url
      }
      if (data.background) {
        if (bgRef.current) URL.revokeObjectURL(bgRef.current)
        const url = data.background.startsWith('http') ? data.background : `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')}${data.background}`
        setBgPreview(url)
        bgRef.current = url
      }
      if (data.favicon) {
        if (faviconRef.current) URL.revokeObjectURL(faviconRef.current)
        const url = data.favicon.startsWith('http') ? data.favicon : `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')}${data.favicon}`
        setFaviconPreview(url)
        faviconRef.current = url
      }
    } catch {
      toast({ title: 'Failed to load branding', variant: 'error' })
    }
  }

  const handleBrandingSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValidHex(brandingForm.primaryColor) || !isValidHex(brandingForm.secondaryColor) || !isValidHex(brandingForm.accentColor)) {
      toast({ title: 'Invalid color format', description: 'Use #RGB, #RRGGBB, or #RRGGBBAA', variant: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('primaryColor', brandingForm.primaryColor)
      formData.append('secondaryColor', brandingForm.secondaryColor)
      formData.append('accentColor', brandingForm.accentColor)
      if (brandingForm.logo) formData.append('logo', brandingForm.logo)
      if (brandingForm.background) formData.append('background', brandingForm.background)
      if (brandingForm.favicon) formData.append('favicon', brandingForm.favicon)

      const data = await brandingApi.update(formData)
      setBranding(data.branding)
      await loadBranding()
      toast({ title: 'Branding updated', variant: 'success' })
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAsset = async (type: 'logo' | 'background' | 'favicon') => {
    try {
      if (type === 'logo') await brandingApi.deleteLogo()
      if (type === 'background') await brandingApi.deleteBackground()
      if (type === 'favicon') await brandingApi.deleteFavicon()
      await loadBranding()
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const handleFileChange = (type: 'logo' | 'background' | 'favicon') => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 5MB', variant: 'error' })
      return
    }
    setBrandingForm((f) => ({ ...f, [type]: file }))
    if (type === 'logo') {
      if (logoRef.current) URL.revokeObjectURL(logoRef.current)
      const url = file ? URL.createObjectURL(file) : null
      setLogoPreview(url)
      logoRef.current = url
    } else if (type === 'background') {
      if (bgRef.current) URL.revokeObjectURL(bgRef.current)
      const url = file ? URL.createObjectURL(file) : null
      setBgPreview(url)
      bgRef.current = url
    } else {
      if (faviconRef.current) URL.revokeObjectURL(faviconRef.current)
      const url = file ? URL.createObjectURL(file) : null
      setFaviconPreview(url)
      faviconRef.current = url
    }
  }

  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setUserError('')
    if (userForm.password !== userForm.confirmPassword) {
      setUserError('Passwords do not match')
      return
    }
    if (userForm.password.length < 6) {
      setUserError('Password must be at least 6 characters')
      return
    }
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', userForm.name)
      payload.append('email', userForm.email)
      payload.append('password', userForm.password)
      payload.append('confirmPassword', userForm.confirmPassword)
      payload.append('role', userForm.role)
      payload.append('mobile', userForm.mobile)
      payload.append('dob', userForm.dob)
      payload.append('gender', userForm.gender)
      payload.append('address', userForm.address)
      if (userFiles.photo) payload.append('photo', userFiles.photo)
      if (userFiles.signature) payload.append('signature', userFiles.signature)
      if (userFiles.pan) payload.append('pan', userFiles.pan)
      if (userFiles.aadhaar) payload.append('aadhaar', userFiles.aadhaar)

      const result = await userApi.create(payload)
      toast({ title: result.message || 'User created successfully', variant: 'success' })
      setUserForm({ name: '', email: '', password: '', confirmPassword: '', role: 'WORKER', mobile: '', dob: '', gender: 'OTHER', address: '' })
      setUserFiles({})
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to create user'
      setUserError(message)
      toast({ title: 'User creation failed', description: message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUserFileChange = (field: 'photo' | 'signature' | 'pan' | 'aadhaar') => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setUserFiles((f) => ({ ...f, [field]: file || undefined }))
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Current password and new password are required.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must contain at least 8 characters.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const result = await authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      toast({ title: result.message || 'Password changed successfully', variant: 'success' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to change password'
      setPasswordError(message)
      toast({ title: 'Password change failed', description: message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { id: 'company' as SettingsTab, label: 'Company Profile', icon: Building2 },
    { id: 'users' as SettingsTab, label: 'User Management', icon: Users },
    // { id: 'theme' as SettingsTab, label: 'Theme Settings', icon: Palette }, // Hidden for now
    ...(user?.role.name === 'ADMIN' ? [{ id: 'password' as SettingsTab, label: 'Change Password', icon: LockKeyhole }] : []),
  ]

  const renderCompanyProfile = () => {
    if (!company) return <Card className="p-6"><p className="text-sm text-text-secondary">No company data available.</p></Card>
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-secondary">Company Profile</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-text-secondary">Company Name</p>
            <p className="text-sm font-medium text-secondary">{company.name}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Created At</p>
            <p className="text-sm font-medium text-secondary">{new Date(company.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Updated At</p>
            <p className="text-sm font-medium text-secondary">{new Date(company.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </Card>
    )
  }

  const renderUserManagement = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-secondary">Create User</h3>
        <form onSubmit={handleUserSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" required>
            <Input required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          </FormField>
          <FormField label="Email" required>
            <Input required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          </FormField>
          <FormField label="Mobile" required>
            <Input required type="tel" value={userForm.mobile} onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })} />
          </FormField>
          <FormField label="Date of Birth" required>
            <Input required type="date" value={userForm.dob} onChange={(e) => setUserForm({ ...userForm, dob: e.target.value })} />
          </FormField>
          <FormField label="Password" required>
            <Input required type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          </FormField>
          <FormField label="Confirm Password" required>
            <Input required type="password" value={userForm.confirmPassword} onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })} />
          </FormField>
          <FormField label="Gender" required>
            <Select required value={userForm.gender} onChange={(e) => setUserForm({ ...userForm, gender: e.target.value })}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </Select>
          </FormField>
          <FormField label="Role" required>
            <Select required value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'MANAGER' | 'WORKER' })}>
              <option value="MANAGER">Manager</option>
              <option value="WORKER">Worker</option>
            </Select>
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <Textarea value={userForm.address} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} />
          </FormField>
          <FormField label="Profile Photo">
            <Input type="file" accept="image/*" onChange={handleUserFileChange('photo')} />
          </FormField>
          <FormField label="E-Signature">
            <Input type="file" accept="image/*" onChange={handleUserFileChange('signature')} />
          </FormField>
          <FormField label="PAN Card">
            <Input type="file" accept="image/*,.pdf" onChange={handleUserFileChange('pan')} />
          </FormField>
          <FormField label="Aadhaar Card">
            <Input type="file" accept="image/*,.pdf" onChange={handleUserFileChange('aadhaar')} />
          </FormField>
          {userError && <Alert variant="error" className="sm:col-span-2">{userError}</Alert>}
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>Create User</Button>
          </div>
        </form>
      </Card>
    </div>
  )

  const renderThemeSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-secondary">Colors</h3>
        <form onSubmit={handleBrandingSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Primary Color">
            <div className="flex gap-2">
              <input type="color" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} className="h-10 w-12 rounded border border-border-gold bg-white p-1" />
              <Input value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} placeholder="#000000" />
            </div>
            <p className="mt-1 text-xs text-text-secondary">Preview: {hexToRgba(brandingForm.primaryColor)}</p>
          </FormField>
          <FormField label="Secondary Color">
            <div className="flex gap-2">
              <input type="color" value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} className="h-10 w-12 rounded border border-border-gold bg-white p-1" />
              <Input value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} placeholder="#000000" />
            </div>
            <p className="mt-1 text-xs text-text-secondary">Preview: {hexToRgba(brandingForm.secondaryColor)}</p>
          </FormField>
          <FormField label="Accent Color">
            <div className="flex gap-2">
              <input type="color" value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} className="h-10 w-12 rounded border border-border-gold bg-white p-1" />
              <Input value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} placeholder="#000000" />
            </div>
            <p className="mt-1 text-xs text-text-secondary">Preview: {hexToRgba(brandingForm.accentColor)}</p>
          </FormField>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" loading={submitting}>Save Branding</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-secondary">Brand Assets</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          {['logo', 'background', 'favicon'].map((asset) => {
            const isImage = asset !== 'favicon'
            const preview = asset === 'logo' ? logoPreview : asset === 'background' ? bgPreview : faviconPreview
            const file = brandingForm[asset as keyof typeof brandingForm] as File | null
            const existingUrl = asset === 'logo' ? branding?.logo : asset === 'background' ? branding?.background : branding?.favicon
            const displayUrl = preview || (existingUrl ? (existingUrl.startsWith('http') ? existingUrl : `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')}${existingUrl}`) : null)

            return (
              <div key={asset} className="space-y-3">
                <p className="text-sm font-semibold text-secondary capitalize">{asset}</p>
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-gold bg-gray-50">
                  {displayUrl ? (
                    isImage ? (
                      <img src={displayUrl} alt={asset} className="h-full w-full object-contain p-2" />
                    ) : (
                      <img src={displayUrl} alt={asset} className="h-full w-full object-contain p-2" />
                    )
                  ) : (
                    <span className="text-xs text-text-secondary">No {asset} uploaded</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-gold bg-white px-3 py-2 text-xs font-medium text-secondary hover:bg-primary/5">
                    <Upload size={14} />
                    {existingUrl && !file ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleFileChange(asset as 'logo' | 'background' | 'favicon')} className="hidden" />
                  </label>
                  {existingUrl && (
                    <Button type="button" variant="danger" size="icon" onClick={() => handleDeleteAsset(asset as 'logo' | 'background' | 'favicon')} className="h-8 w-8 p-1.5">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                {file && <p className="text-xs text-text-secondary">{file.name} ({formatFileSize(file.size)})</p>}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )

  const renderChangePassword = () => (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-secondary">Change Password</h3>
      <form onSubmit={handlePasswordSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Current Password" required>
          <Input required type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
        </FormField>
        <FormField label="New Password" required>
          <Input required type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
        </FormField>
        <FormField label="Confirm New Password" required>
          <Input required type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
        </FormField>
        {passwordError && <Alert variant="error" className="sm:col-span-2">{passwordError}</Alert>}
        <div className="sm:col-span-2">
          <Button type="submit" loading={submitting}>Change Password</Button>
        </div>
      </form>
    </Card>
  )

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary-dark">SETTINGS</p>
        <h2 className="mt-1 text-3xl font-bold text-secondary">Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your company, users, and branding preferences.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="w-full lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-secondary' : 'text-secondary hover:bg-sidebar-hover hover:text-white'}`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="flex-1">
          {loading ? (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-48 animate-pulse rounded bg-primary/10" />
                <div className="h-4 w-full animate-pulse rounded bg-primary/10" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-primary/10" />
              </div>
            </Card>
          ) : (
            <>
              {activeTab === 'company' && renderCompanyProfile()}
              {activeTab === 'users' && renderUserManagement()}
              {activeTab === 'theme' && renderThemeSettings()}
              {activeTab === 'password' && renderChangePassword()}
            </>
          )}
        </div>
      </div>
    </>
  )
}
