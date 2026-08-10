import { useState } from 'react'
import { Gem, Loader2 } from 'lucide-react'
import { getAuthErrorMessage, useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'

export function LoginPage() {
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          <p className="mb-6 text-center text-sm text-surface-400">
            Login dengan Google — hanya akun yang diizinkan
          </p>

          {error && (
            <p className="mb-4 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-negative">
              {error}
            </p>
          )}

          <Button variant="secondary" disabled={loading} onClick={handleGoogle} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Lanjutkan dengan Google'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
