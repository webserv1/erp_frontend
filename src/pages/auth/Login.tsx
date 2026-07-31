import { useState, type FormEvent } from 'react'
import { LockKeyhole, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField, Input } from '../../components/forms'
import { AuthLayout } from '../../components/layout'
import { Alert, Button, useToast } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { authApi } from '../../services/auth.api'
import type { ApiError } from '../../types/auth.types'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await authApi.login(email, password)
      login(data)
      toast({ title: 'Signed in successfully', description: `Welcome back, ${data.user.name}.`, variant: 'success' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = (err as ApiError).message || 'Unable to sign in.'
      setError(message)
      toast({ title: 'Sign in failed', description: message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your premium ERP workspace">
      <form onSubmit={submit} className="space-y-5">
        <FormField label="Email" icon={<Mail size={18} />}>
          <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" />
        </FormField>
        <FormField label="Password" icon={<LockKeyhole size={18} />}>
          <Input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
        </FormField>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" loading={submitting} className="w-full">Sign in</Button>
        <p className="text-center text-sm text-text-secondary">
          Dont have an account! <Link className="font-semibold text-primary-dark hover:underline" to="/register">Signup</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
