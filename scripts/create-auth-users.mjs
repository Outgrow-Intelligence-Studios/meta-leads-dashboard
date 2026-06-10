import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const EMAILS = [
  'sj@columbus-clean.in',
  'info@columbus-clean.in',
  'columbuscleanindia.outgrow@gmail.com',
]

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Pull from Vercel first:  vercel env pull .env.local')
  console.error('Then run:                 node --env-file=.env.local scripts/create-auth-users.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function listAllUsers() {
  const all = []
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    all.push(...data.users)
    if (data.users.length < 200) break
    page += 1
  }
  return all
}

async function ensureUser(email) {
  const existing = (await listAllUsers()).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )
  if (existing) {
    console.log(`✓ ${email}  already exists (id: ${existing.id})`)
    return existing
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { created_via: 'meta-leads-dashboard setup' },
  })
  if (error) throw error
  console.log(`✓ ${email}  created (id: ${data.user.id})`)
  return data.user
}

const results = await Promise.allSettled(EMAILS.map(ensureUser))
const failures = results.filter((r) => r.status === 'rejected')

if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):`)
  for (const f of failures) console.error('  -', f.reason?.message || f.reason)
  process.exit(1)
}

console.log('\nDone. Users can now sign in with OTP from the dashboard.')
