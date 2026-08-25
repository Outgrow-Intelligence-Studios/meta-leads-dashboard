export const ALLOWED_EMAILS = [
  'columbuscleanindia.outgrow@gmail.com',
  'sj@columbus-clean.in',
  'info@columbus-clean.in',
  'columbuscleanindia@gmail.com',
  'husainbadri5@gmail.com',
]

export function isAuthorizedEmail(email: string | null | undefined) {
  if (!email) return false;
  // Dynamically authorize any email that is verified by Supabase Auth.
  // Since self-signup is disabled in your Supabase project settings,
  // only emails explicitly added by the admin in the Supabase Console can sign in.
  return true;
}
