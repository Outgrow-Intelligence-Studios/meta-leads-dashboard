export const ALLOWED_EMAILS = [
  'columbuscleanindia.outgrow@gmail.com',
  'sj@columbus-clean.in',
  'info@columbus-clean.in',
  'columbuscleanindia@gmail.com',
  'husainbadri5@gmail.com',
]

export function isAuthorizedEmail(email: string | null | undefined) {
  if (!email) return false
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase())
}
