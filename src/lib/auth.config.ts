/** Email Google yang diizinkan akses — pisahkan dengan koma di .env.local */
export function getAllowedEmails(): string[] {
  const raw = import.meta.env.VITE_ALLOWED_EMAILS ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = getAllowedEmails()
  if (allowed.length === 0) return true // dev fallback jika env belum di-set
  return allowed.includes(email.toLowerCase())
}
