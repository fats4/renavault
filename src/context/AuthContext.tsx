import type { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isEmailAllowed } from '../lib/auth.config'
import { auth, isFirebaseConfigured } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  authRequired: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ACCESS_DENIED_MSG = 'Akun Google ini tidak diizinkan. Hanya 2 akun terdaftar yang bisa akses.'

async function enforceAllowedUser(user: User | null): Promise<User | null> {
  if (!user) return null
  if (!isEmailAllowed(user.email)) {
    if (auth) await signOut(auth)
    throw new Error(ACCESS_DENIED_MSG)
  }
  return user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured())
  const authRequired = isFirebaseConfigured()

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !isEmailAllowed(currentUser.email)) {
        await signOut(auth!)
        setUser(null)
      } else {
        setUser(currentUser)
      }
      setLoading(false)
    })
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase Auth belum dikonfigurasi')
    const result = await signInWithPopup(auth, new GoogleAuthProvider())
    await enforceAllowedUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      authRequired,
      loginWithGoogle,
      logout,
    }),
    [user, loading, authRequired, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as FirebaseError).code
    if (code === 'auth/popup-closed-by-user') return 'Login Google dibatalkan.'
  }
  return 'Terjadi kesalahan. Coba lagi.'
}
