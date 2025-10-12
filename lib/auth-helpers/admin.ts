export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export function adminBypassEnabled() {
  return process.env.FREE_ADMIN_BYPASS === '1';
}
