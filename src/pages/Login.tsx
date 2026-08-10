import { useState } from 'react'
import { Gem, Loader2, LogIn, UserPlus } from 'lucide-react'
import { getAuthErrorMessage, useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

type Mode = 'login' | 'signup' | 'reset'

export function LoginPage() {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else if (mode === 'signup') {
        await signup(email, password)
      } else {
        await resetPassword(email)
        setMessage('Link reset password dikirim ke email kamu.')
      }
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
            <Gem className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">Renavault</h1>
          <p className="mt-1 text-sm text-surface-500">CFO Suite — Financial Command Center</p>
        </div>

        <div className="rounded-2xl border border-surface-700 bg-surface-900 p-6 shadow-xl">
          {mode !== 'reset' && (
            <div className="mb-6 flex rounded-lg bg-surface-800 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setMessage(null)
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'login' ? 'bg-surface-700 text-white' : 'text-surface-400'
                }`}
              >
                <LogIn className="h-4 w-4" />
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setMessage(null)
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'signup' ? 'bg-surface-700 text-white' : 'text-surface-400'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Daftar
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <p className="mb-4 text-sm text-surface-400">
              Masukkan email untuk menerima link reset password.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="nama@brand.com"
            />

            {mode !== 'reset' && (
              <Input
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="Minimal 6 karakter"
              />
            )}

            {error && (
              <p className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-negative">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-lg border border-positive/30 bg-positive/10 px-3 py-2 text-sm text-positive">
                {message}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'login' ? (
                'Masuk'
              ) : mode === 'signup' ? (
                'Buat Akun'
              ) : (
                'Kirim Link Reset'
              )}
            </Button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-surface-700" />
                <span className="text-xs text-surface-500">atau</span>
                <div className="h-px flex-1 bg-surface-700" />
              </div>

              <Button
                variant="secondary"
                disabled={loading}
                onClick={handleGoogle}
                className="w-full"
              >
                Lanjutkan dengan Google
              </Button>
            </>
          )}

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('reset')
                  setError(null)
                  setMessage(null)
                }}
                className="text-xs text-surface-400 hover:text-accent"
              >
                Lupa password?
              </button>
            ) : mode === 'reset' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setMessage(null)
                }}
                className="text-xs text-surface-400 hover:text-accent"
              >
                ← Kembali ke login
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
