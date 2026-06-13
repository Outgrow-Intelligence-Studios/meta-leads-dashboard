import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isAuthorizedEmail } from '@/lib/auth'
import ogLogo from '@/assets/oi-logo.png'

const errorMessages: Record<string, string> = {
  unauthorized: 'This email address is not authorized to access this dashboard.',
  auth_failed: 'Sign-in did not complete. Please try again.',
  invalid_email: 'Please enter a valid email address.',
  invalid_otp: 'Invalid or expired code. Please try again.',
}

export default function LoginCard({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const trimmed = email.trim().toLowerCase()

    if (!trimmed || !trimmed.includes('@')) {
      setError(errorMessages.invalid_email)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: false },
    })

    if (error) {
      setLoading(false)
      setError(error.message)
    } else {
      setStep('otp')
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    })

    if (error) {
      setLoading(false)
      setError(errorMessages.invalid_otp)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAuthorizedEmail(user.email)) {
      await supabase.auth.signOut()
      setLoading(false)
      setError(errorMessages.unauthorized)
      return
    }

    onAuthenticated()
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="https://www.columbus-clean.com/wp-content/uploads/2025/09/logo-c-2.png"
            alt="Columbus Clean"
            className="h-8 mx-auto mb-6 opacity-90"
          />
          <div className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            Leads CRM
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-xl font-semibold text-white">
            {step === 'email' ? 'Sign in' : 'Enter code'}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            {step === 'email'
              ? 'Enter your email to receive a one-time code.'
              : `We sent a code to ${email}. Enter it below.`}
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#ed1c24] focus:outline-none focus:ring-1 focus:ring-[#ed1c24]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#ed1c24] py-3 text-sm font-semibold text-white hover:bg-[#c41a20] disabled:opacity-40 transition-colors"
              >
                {loading ? 'Sending...' : 'Send code'}
              </button>
              <p className="text-xs text-neutral-500 text-center">
                Only authorized addresses can access this dashboard.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                required
                autoFocus
                autoComplete="one-time-code"
                placeholder="00000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg tracking-[0.3em] text-white placeholder:text-neutral-500 focus:border-[#ed1c24] focus:outline-none focus:ring-1 focus:ring-[#ed1c24]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#ed1c24] py-3 text-sm font-semibold text-white hover:bg-[#c41a20] disabled:opacity-40 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-600">
          Powered by{' '}
          <img
            src={ogLogo}
            alt="Outgrow"
            className="inline h-3 opacity-60"
          />
        </p>
      </div>
    </div>
  )
}
