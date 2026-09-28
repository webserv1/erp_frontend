import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FormField, Input } from '../../components/forms'
import { AuthLayout } from '../../components/layout'
import { Alert, Button, useToast } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { authApi } from '../../services/auth.api'
import type { ApiError } from '../../types/auth.types'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
          <div className="relative">
            <Input
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-text-secondary hover:text-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" loading={submitting} className="w-full">Sign in</Button>
        {/* <p className="text-center text-sm text-text-secondary">
          Dont have an account! <Link className="font-semibold text-primary-dark hover:underline" to="/register">Signup</Link>
        </p> */}
      </form>
    </AuthLayout>
  )
}
