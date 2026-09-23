import { useEffect, useState, useRef } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Building2, CalendarDays, ChevronRight, Download, FileBadge2, FileUser, IdCard, LockKeyhole, Mail, Phone, Shield, Trash2, Upload, Users } from 'lucide-react'
import { useToast, Button, Card, Alert, Modal } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { FormField, Input, Select, Textarea } from '../../components/forms'
import { companyApi, brandingApi } from '../../services/company.api'
import type { ProfileUser } from '../../services/company.api'
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

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

const formatDateOnly = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const getInitials = (name?: string | null) => {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const roleBadgeClass = (role?: string | null) => {
  if (role === 'ADMIN') return 'bg-primary/20 text-secondary border-primary/40'
  if (role === 'MANAGER') return 'bg-blue-50 text-blue-800 border-blue-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

const statusBadgeClass = (status?: boolean) => status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
const rolePriority = (role?: string | null) => {
  if (role === 'ADMIN') return 0
  if (role === 'MANAGER') return 1
  return 2
}

export const Settings = () => {
  const { toast } = useToast()
  const { user } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileUser | null>(null)
  const [companyUsers, setCompanyUsers] = useState<ProfileUser[]>([])
  const [profileRoles, setProfileRoles] = useState<Array<{ id: number; name: string }>>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [pendingDeleteProfile, setPendingDeleteProfile] = useState<ProfileUser | null>(null)
  const [profileError, setProfileError] = useState('')
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobile: '',
    dob: '',
    gender: 'OTHER',
    address: '',
    role: 'WORKER',
    status: true,
  })
  const [profileFiles, setProfileFiles] = useState<{ photo?: File; signature?: File; pan?: File; aadhaar?: File }>({})
  const [branding, setBranding] = useState<Branding | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [backupDownloading, setBackupDownloading] = useState(false)
  const [lastBackupDownloadedAt, setLastBackupDownloadedAt] = useState<string | null>(() => localStorage.getItem('erp_last_backup_downloaded_at'))
  const [activeTab, setActiveTab] = useState<SettingsTab>('company')
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)

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
          setCurrentUserProfile(profileData.currentUser)
          setCompanyUsers(profileData.users || [])
          setProfileRoles(profileData.roles || [])
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

  useEffect(() => {
    if (!companyUsers.length) {
      setSelectedUserId(null)
      return
    }
    if (selectedUserId && companyUsers.some((profile) => profile.id === selectedUserId)) {
      return
    }
    const adminProfile = companyUsers.find((profile) => profile.role?.name === 'ADMIN')
    const preferredId = adminProfile?.id
      || (currentUserProfile?.id && companyUsers.some((profile) => profile.id === currentUserProfile.id) ? currentUserProfile.id : null)
      || companyUsers[0].id
    setSelectedUserId(preferredId)
  }, [companyUsers, currentUserProfile, selectedUserId])

  const resolveMediaUrl = (url?: string | null) => {
    if (!url) return null
    const rawValue = String(url).trim()
    if (!rawValue) return null

    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    let backendOrigin = ''
    try {
      backendOrigin = new URL(apiBase).origin
    } catch {
      backendOrigin = ''
    }

    if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
      try {
        const parsedUrl = new URL(rawValue)
        if (
          backendOrigin
          && parsedUrl.origin !== backendOrigin
          && /^\/(api\/)?uploads\//i.test(parsedUrl.pathname)
        ) {
          const normalizedPath = parsedUrl.pathname.replace(/^\/api\//i, '/')
          return `${backendOrigin}${normalizedPath}${parsedUrl.search}`
        }
      } catch {
        return rawValue
      }
      return rawValue
    }

    let normalizedPath = rawValue
      .replace(/^api\/uploads\//i, '/uploads/')
      .replace(/^\/api\/uploads\//i, '/uploads/')
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`
    }

    if (backendOrigin) {
      return `${backendOrigin}${normalizedPath}`
    }
    return normalizedPath
  }

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
      const profileData = await companyApi.getProfile()
      setCurrentUserProfile(profileData.currentUser)
      setCompanyUsers(profileData.users || [])
      setProfileRoles(profileData.roles || [])
      toast({ title: result.message || 'User created successfully', variant: 'success' })
      setUserForm({ name: '', email: '', password: '', confirmPassword: '', role: 'WORKER', mobile: '', dob: '', gender: 'OTHER', address: '' })
      setUserFiles({})
      setCreateUserModalOpen(false)
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

  const openCreateUserModal = () => {
    setUserError('')
    setUserForm({ name: '', email: '', password: '', confirmPassword: '', role: 'WORKER', mobile: '', dob: '', gender: 'OTHER', address: '' })
    setUserFiles({})
    setCreateUserModalOpen(true)
  }

  const closeCreateUserModal = () => {
    setCreateUserModalOpen(false)
    setUserError('')
  }

  const openEditProfile = (profile: ProfileUser) => {
    setProfileError('')
    setEditingUserId(profile.id)
    setProfileForm({
      name: profile.name || '',
      email: profile.email || '',
      mobile: profile.mobile || '',
      dob: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : '',
      gender: profile.gender || 'OTHER',
      address: profile.address || '',
      role: profile.role?.name || 'WORKER',
      status: Boolean(profile.status),
    })
    setProfileFiles({})
  }

  const cancelEditProfile = () => {
    setEditingUserId(null)
    setProfileError('')
    setProfileFiles({})
  }

  const handleProfileFileChange = (field: 'photo' | 'signature' | 'pan' | 'aadhaar') => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProfileFiles((prev) => ({ ...prev, [field]: file || undefined }))
  }

  const requestDeleteUserProfile = (profile: ProfileUser) => {
    if (user?.role.name !== 'ADMIN') return
    if (currentUserProfile?.id === profile.id) {
      toast({ title: 'Delete not allowed', description: 'You cannot delete your own profile.', variant: 'error' })
      return
    }
    if (profile.role?.name === 'ADMIN') {
      toast({ title: 'Delete not allowed', description: 'Admin profiles cannot be deleted.', variant: 'error' })
      return
    }
    setPendingDeleteProfile(profile)
  }

  const closeDeleteUserModal = () => {
    if (deletingUserId) return
    setPendingDeleteProfile(null)
  }

  const handleDeleteUserProfile = async () => {
    if (!pendingDeleteProfile) return
    const profile = pendingDeleteProfile

    setDeletingUserId(profile.id)
    try {
      const result = await companyApi.deleteUserProfile(profile.id)
      const profileData = await companyApi.getProfile()
      setCurrentUserProfile(profileData.currentUser)
      setCompanyUsers(profileData.users || [])
      setProfileRoles(profileData.roles || [])
      if (selectedUserId === profile.id) {
        setEditingUserId(null)
        setSelectedUserId(null)
      }
      setPendingDeleteProfile(null)
      toast({ title: result.message || 'User profile deleted successfully.', variant: 'success' })
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to delete user profile'
      toast({ title: 'Delete failed', description: message, variant: 'error' })
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingUserId) return

    setProfileError('')
    if (!profileForm.name.trim()) {
      setProfileError('Name is required.')
      return
    }
    if (!profileForm.email.trim()) {
      setProfileError('Email is required.')
      return
    }
    if (!profileForm.mobile.trim()) {
      setProfileError('Mobile is required.')
      return
    }
    if (!profileForm.dob) {
      setProfileError('Date of birth is required.')
      return
    }
    if (!profileForm.address.trim()) {
      setProfileError('Address is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', profileForm.name.trim())
      payload.append('email', profileForm.email.trim())
      payload.append('mobile', profileForm.mobile.trim())
      payload.append('dob', profileForm.dob)
      payload.append('gender', profileForm.gender)
      payload.append('address', profileForm.address.trim())
      payload.append('role', profileForm.role)
      payload.append('status', profileForm.status ? 'true' : 'false')
      if (profileFiles.photo) payload.append('photo', profileFiles.photo)
      if (profileFiles.signature) payload.append('signature', profileFiles.signature)
      if (profileFiles.pan) payload.append('pan', profileFiles.pan)
      if (profileFiles.aadhaar) payload.append('aadhaar', profileFiles.aadhaar)

      const result = await companyApi.updateUserProfile(editingUserId, payload)
      const profileData = await companyApi.getProfile()
      setCurrentUserProfile(profileData.currentUser)
      setCompanyUsers(profileData.users || [])
      setProfileRoles(profileData.roles || [])
      setSelectedUserId(result.user.id)
      setEditingUserId(null)
      setProfileFiles({})
      toast({ title: result.message || 'Profile updated successfully', variant: 'success' })
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to update profile'
      setProfileError(message)
      toast({ title: 'Profile update failed', description: message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadBackup = async () => {
    if (user?.role.name !== 'ADMIN') {
      toast({ title: 'Access denied', description: 'Only admin can download backups.', variant: 'error' })
      return
    }

    setBackupDownloading(true)
    try {
      const { blob, fileName } = await companyApi.downloadBackup()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      const downloadedAt = new Date().toISOString()
      localStorage.setItem('erp_last_backup_downloaded_at', downloadedAt)
      setLastBackupDownloadedAt(downloadedAt)
      toast({ title: 'Backup downloaded', description: 'Your company backup file has been downloaded.', variant: 'success' })
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to download backup'
      toast({ title: 'Backup failed', description: message, variant: 'error' })
    } finally {
      setBackupDownloading(false)
    }
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
    ...(user?.role.name === 'ADMIN' ? [{ id: 'users' as SettingsTab, label: 'User Management', icon: Users }] : []),
    // { id: 'theme' as SettingsTab, label: 'Theme Settings', icon: Palette }, // Hidden for now
    ...(user?.role.name === 'ADMIN' ? [{ id: 'password' as SettingsTab, label: 'Change Password', icon: LockKeyhole }] : []),
  ]

  const renderCompanyProfile = () => {
    if (!company) return <Card className="p-6"><p className="text-sm text-text-secondary">No company data available.</p></Card>
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-secondary">Company Profile</h3>
            {user?.role.name === 'ADMIN' && (
              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => void handleDownloadBackup()} loading={backupDownloading}>
                <Download size={14} />
                Backup
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-text-secondary">Company Name</p>
              <p className="text-sm font-medium text-secondary">{company.name}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Created At</p>
              <p className="text-sm font-medium text-secondary">{formatDateTime(company.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Updated At</p>
              <p className="text-sm font-medium text-secondary">{formatDateTime(company.updatedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Users</p>
              <p className="text-sm font-medium text-secondary">{companyUsers.length}</p>
            </div>
          </div>
          {user?.role.name === 'ADMIN' && (
            <p className="mt-4 text-xs text-text-secondary">
              Last backup downloaded at: <span className="font-medium text-secondary">{lastBackupDownloadedAt ? formatDateTime(lastBackupDownloadedAt) : 'Never'}</span>
            </p>
          )}
          <p className="mt-4 text-xs text-text-secondary">Go to the User Management tab to view and manage detailed user profiles and documents.</p>
        </Card>
      </div>
    )
  }

  const renderUserManagement = () => {
    const orderedUsers = [...companyUsers].sort((a, b) => {
      const roleOrder = rolePriority(a.role?.name) - rolePriority(b.role?.name)
      if (roleOrder !== 0) return roleOrder
      return (a.name || '').localeCompare(b.name || '')
    })
    const selectedUser = orderedUsers.find((profile) => profile.id === selectedUserId) || currentUserProfile || orderedUsers[0] || null
    const otherUsers = orderedUsers.filter((profile) => selectedUser ? profile.id !== selectedUser.id : true)

    if (!selectedUser) {
      return (
        <Card className="p-6">
          <p className="text-sm text-text-secondary">No user profiles available.</p>
        </Card>
      )
    }

    const avatarUrl = resolveMediaUrl(selectedUser.photoUrl)
    const isEditingSelectedUser = editingUserId === selectedUser.id
    const canManageRoleStatus = user?.role.name === 'ADMIN'
    const isSelfSelected = currentUserProfile?.id === selectedUser.id
    const canDeleteSelected = user?.role.name === 'ADMIN' && !isSelfSelected && selectedUser.role?.name !== 'ADMIN'
    const documentTiles = [
      { label: 'Profile Photo', value: selectedUser.photoUrl, icon: FileUser },
      { label: 'E-Signature', value: selectedUser.signatureUrl, icon: FileBadge2 },
      { label: 'PAN Card', value: selectedUser.panUrl, icon: IdCard },
      { label: 'Aadhaar Card', value: selectedUser.aadhaarUrl, icon: Shield },
    ] as const

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-5">
              {avatarUrl ? (
                <img src={avatarUrl} alt={selectedUser.name} className="h-16 w-16 rounded-full border border-border-gold object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border-gold bg-primary/10 text-lg font-semibold text-secondary">
                  {getInitials(selectedUser.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-2xl font-semibold text-secondary">{selectedUser.name || '-'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(selectedUser.role?.name)}`}>
                    {selectedUser.role?.name || 'USER'}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(selectedUser.status)}`}>
                    {selectedUser.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-1.5"><Mail size={14} />{selectedUser.email || '-'}</span>
                  <span className="inline-flex items-center gap-1.5"><Phone size={14} />{selectedUser.mobile || '-'}</span>
                </div>
              </div>
            </div>
            {isEditingSelectedUser ? (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={cancelEditProfile} disabled={submitting}>Cancel</Button>
                <Button type="submit" form="profile-edit-form" loading={submitting}>Save Changes</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={openCreateUserModal}>
                  Create User
                </Button>
                {canDeleteSelected && (
                  <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    title="Delete user"
                    onClick={() => requestDeleteUserProfile(selectedUser)}
                    loading={deletingUserId === selectedUser.id}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                <Button type="button" onClick={() => openEditProfile(selectedUser)}>
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </Card>

        <form id="profile-edit-form" onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid gap-7 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Card className="p-7">
              <h4 className="mb-5 text-base font-semibold text-secondary">Personal Information</h4>
              {isEditingSelectedUser ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name" required>
                    <Input required value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} />
                  </FormField>
                  <FormField label="Email" required>
                    <Input required type="email" value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </FormField>
                  <FormField label="Mobile" required>
                    <Input required type="tel" value={profileForm.mobile} onChange={(e) => setProfileForm((prev) => ({ ...prev, mobile: e.target.value }))} />
                  </FormField>
                  <FormField label="Date of Birth" required>
                    <Input required type="date" value={profileForm.dob} onChange={(e) => setProfileForm((prev) => ({ ...prev, dob: e.target.value }))} />
                  </FormField>
                  <FormField label="Gender" required>
                    <Select value={profileForm.gender} onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </Select>
                  </FormField>
                  {canManageRoleStatus && (
                    <FormField label="Role" required>
                      <Select value={profileForm.role} onChange={(e) => setProfileForm((prev) => ({ ...prev, role: e.target.value }))} disabled={isSelfSelected}>
                        {profileRoles.map((role) => (
                          <option key={role.id} value={role.name}>{role.name}</option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                  {canManageRoleStatus && (
                    <FormField label="Status" required>
                      <Select value={profileForm.status ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setProfileForm((prev) => ({ ...prev, status: e.target.value === 'ACTIVE' }))} disabled={isSelfSelected}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </Select>
                    </FormField>
                  )}
                  <FormField label="Address" className="sm:col-span-2" required>
                    <Textarea required value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} />
                  </FormField>
                </div>
              ) : (
                <div className="divide-y divide-border-gold/40 rounded-lg border border-border-gold/60 bg-white">
                  {[
                    { label: 'Name', value: selectedUser.name || '-' },
                    { label: 'Email', value: selectedUser.email || '-' },
                    { label: 'Mobile', value: selectedUser.mobile || '-' },
                    { label: 'Date of Birth', value: formatDateOnly(selectedUser.dateOfBirth) },
                    { label: 'Gender', value: selectedUser.gender || '-' },
                    { label: 'Role', value: selectedUser.role?.name || '-' },
                    { label: 'Status', value: selectedUser.status ? 'Active' : 'Inactive' },
                    { label: 'Address', value: selectedUser.address || '-', multiline: true },
                  ].map((item) => (
                    <div key={item.label} className="grid gap-1.5 px-5 py-4 sm:grid-cols-[145px_minmax(0,1fr)] sm:items-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{item.label}</p>
                      <p className={`text-sm text-secondary leading-6 ${item.multiline ? 'whitespace-pre-wrap break-words' : 'break-words'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-7">
              <h4 className="mb-5 text-base font-semibold text-secondary">Documents</h4>
              <div className="grid gap-4 sm:grid-cols-1 2xl:grid-cols-2">
                {documentTiles.map((doc) => {
                  const mediaUrl = resolveMediaUrl(doc.value)
                  return (
                    <div key={doc.label} className="rounded-lg border border-border-gold/70 p-4">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-md bg-primary/10 p-2">
                          <doc.icon size={16} className="text-secondary" />
                        </div>
                        <p className="text-base font-semibold text-secondary">{doc.label}</p>
                      </div>
                      <div className="mt-3.5 space-y-2">
                        {mediaUrl ? (
                          <a href={mediaUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-primary underline">
                            View Upload
                          </a>
                        ) : (
                          <span className="block text-sm text-text-secondary">Not uploaded</span>
                        )}
                        {isEditingSelectedUser && (
                          <Input
                            type="file"
                            accept={doc.label === 'PAN Card' || doc.label === 'Aadhaar Card' ? 'image/*,.pdf' : 'image/*'}
                            onChange={
                              doc.label === 'Profile Photo'
                                ? handleProfileFileChange('photo')
                                : doc.label === 'E-Signature'
                                  ? handleProfileFileChange('signature')
                                  : doc.label === 'PAN Card'
                                    ? handleProfileFileChange('pan')
                                    : handleProfileFileChange('aadhaar')
                            }
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
          {profileError && <Alert variant="error">{profileError}</Alert>}
        </form>

        <Card className="p-6">
          <h4 className="mb-4 text-base font-semibold text-secondary">Account Information</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border-gold/60 px-3 py-2.5">
              <CalendarDays size={16} className="text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Created At</p>
                <p className="text-sm font-medium text-secondary">{formatDateTime(selectedUser.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border-gold/60 px-3 py-2.5">
              <CalendarDays size={16} className="text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Updated At</p>
                <p className="text-sm font-medium text-secondary">{formatDateTime(selectedUser.updatedAt)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="mb-4 text-base font-semibold text-secondary">Other Users</h4>
          {otherUsers.length === 0 ? (
            <p className="text-sm text-text-secondary">No other users available.</p>
          ) : (
            <div className="space-y-3">
              {otherUsers.map((profile) => {
                const listAvatarUrl = resolveMediaUrl(profile.photoUrl)
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(profile.id)
                      setEditingUserId(null)
                      setProfileError('')
                      setProfileFiles({})
                    }}
                    className="flex w-full flex-wrap items-center gap-3.5 rounded-lg border border-border-gold/60 px-3.5 py-3 text-left transition-colors hover:bg-primary/5"
                  >
                    {listAvatarUrl ? (
                      <img src={listAvatarUrl} alt={profile.name} className="h-10 w-10 rounded-full border border-border-gold object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-gold bg-primary/10 text-xs font-semibold text-secondary">
                        {getInitials(profile.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-secondary">{profile.name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${roleBadgeClass(profile.role?.name)}`}>
                          {profile.role?.name || 'USER'}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(profile.status)}`}>
                          {profile.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                        <span className="inline-flex items-center gap-1"><Mail size={12} />{profile.email || '-'}</span>
                        <span className="inline-flex items-center gap-1"><Phone size={12} />{profile.mobile || '-'}</span>
                        <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatDateOnly(profile.dateOfBirth)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {user?.role.name === 'ADMIN' && profile.role?.name !== 'ADMIN' && (
                        <Button
                          type="button"
                          variant="danger"
                          size="icon"
                          className="h-8 w-8 p-1.5"
                          title={`Delete ${profile.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            requestDeleteUserProfile(profile)
                          }}
                          loading={deletingUserId === profile.id}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                      <ChevronRight size={16} className="text-text-secondary" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        <Modal
          open={Boolean(pendingDeleteProfile)}
          onClose={closeDeleteUserModal}
          title="Delete User"
          footer={
            <>
              <Button type="button" variant="outline" onClick={closeDeleteUserModal} disabled={Boolean(deletingUserId)}>Cancel</Button>
              <Button type="button" variant="danger" onClick={() => void handleDeleteUserProfile()} loading={Boolean(deletingUserId)}>
                Delete User
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-secondary">
              Are you sure you want to delete <span className="font-semibold">{pendingDeleteProfile?.name}</span>?
            </p>
            <p className="text-xs text-text-secondary">This action cannot be undone.</p>
          </div>
        </Modal>

        <Modal
          open={createUserModalOpen}
          onClose={closeCreateUserModal}
          title="Create User"
          footer={
            <>
              <Button type="button" variant="outline" onClick={closeCreateUserModal} disabled={submitting}>Cancel</Button>
              <Button type="submit" form="create-user-form" loading={submitting}>Create User</Button>
            </>
          }
        >
          <form id="create-user-form" onSubmit={handleUserSubmit} className="grid gap-4 sm:grid-cols-2">
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
          </form>
        </Modal>
      </div>
    )
  }

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
        {activeTab === 'users' ? (
          <>
            <p className="text-sm font-semibold text-primary-dark">Settings &gt; User Management</p>
            <h2 className="mt-1 text-3xl font-bold text-secondary">User Management</h2>
            <p className="mt-1 text-sm text-text-secondary">Manage your users, roles and access permissions.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary-dark">SETTINGS</p>
            <h2 className="mt-1 text-3xl font-bold text-secondary">Settings</h2>
            <p className="mt-1 text-sm text-text-secondary">Manage your company, users, and branding preferences.</p>
          </>
        )}
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
