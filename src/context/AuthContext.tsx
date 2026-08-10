import type { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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
import { auth, isFirebaseConfigured } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  authRequired: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function mapAuthError(code: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-email': 'Email tidak valid.',
    'auth/user-disabled': 'Akun dinonaktifkan.',
    'auth/user-not-found': 'Email belum terdaftar.',
    'auth/wrong-password': 'Password salah.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/email-already-in-use': 'Email sudah terdaftar.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/popup-closed-by-user': 'Login Google dibatalkan.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
  }
  return messages[code] ?? 'Terjadi kesalahan. Coba lagi.'
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

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth belum dikonfigurasi')
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signup = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth belum dikonfigurasi')
    await createUserWithEmailAndPassword(auth, email, password)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase Auth belum dikonfigurasi')
    await signInWithPopup(auth, new GoogleAuthProvider())
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firebase Auth belum dikonfigurasi')
    await sendPasswordResetEmail(auth, email)
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
      login,
      signup,
      loginWithGoogle,
      resetPassword,
      logout,
    }),
    [user, loading, authRequired, login, signup, loginWithGoogle, resetPassword, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return mapAuthError((err as FirebaseError).code)
  }
  return err instanceof Error ? err.message : 'Terjadi kesalahan.'
}
