import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField, Input, Select } from '../../components/forms'
import { AuthLayout } from '../../components/layout'
import { Alert, Button, useToast } from '../../components/ui'
import { authApi } from '../../services/auth.api'
import type { ApiError } from '../../types/auth.types'

const fields = [
  { name: 'companyName', label: 'Company name' },
  { name: 'name', label: 'Full name' },
  { name: 'dob', label: 'Date of birth', type: 'date' },
  { name: 'mobile', label: 'Mobile number', type: 'tel' },
  { name: 'email', label: 'Email address', type: 'email' },
  { name: 'address', label: 'Address' },
  { name: 'password', label: 'Password', type: 'password' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password' },
]

const uploads = [
  { name: 'photo', label: 'Profile photo' },
  { name: 'signature', label: 'E-signature' },
  { name: 'pan', label: 'PAN card' },
  { name: 'aadhaar', label: 'Aadhaar card' },
]

export const Register = () => {
  const [values, setValues] = useState<Record<string, string>>({ gender: 'MALE' })
  const [files, setFiles] = useState<Record<string, File>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const update = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setFiles((current) => ({ ...current, [event.target.name]: file }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    const payload = new FormData()
    Object.entries(values).forEach(([key, value]) => payload.append(key, value))
    Object.entries(files).forEach(([key, file]) => payload.append(key, file))
    setSubmitting(true)

    try {
      const result = await authApi.register(payload)
      const message = `Company created. Your login email is ${result.loginEmail}.`
      setSuccess(message)
      toast({ title: 'Company account created', description: 'You can now sign in with your email.', variant: 'success' })
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      const message = (err as ApiError).message || 'Unable to create company.'
      setError(message)
      toast({ title: 'Registration failed', description: message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create Your Admin Profile" subtitle="Your account will be the company administrator.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ name, label, type = 'text' }) => (
          <FormField key={name} label={label}>
            <Input required name={name} type={type} value={values[name] ?? ''} onChange={update} />
          </FormField>
        ))}
        <FormField label="Gender">
          <Select required name="gender" value={values.gender} onChange={update}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </Select>
        </FormField>
        {uploads.map(({ name, label }) => (
          <FormField key={name} label={label}>
            <Input required name={name} type="file" accept="image/*" onChange={selectFile} className="file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-primary-dark" />
          </FormField>
        ))}
        {error && <Alert variant="error" className="sm:col-span-2">{error}</Alert>}
        {success && <Alert variant="success" className="sm:col-span-2">{success}</Alert>}
        <Button type="submit" loading={submitting} className="sm:col-span-2">Submit</Button>
        <p className="sm:col-span-2 text-center text-sm text-text-secondary">
          Already registered? <Link className="font-semibold text-primary-dark hover:underline" to="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
