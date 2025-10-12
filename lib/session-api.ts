import { getToken } from 'next-auth/jwt';
import type { NextApiRequest } from 'next';
import { parseSharedWalletToken } from './auth-helpers/wallet-hook';
import { isAdminEmail } from './auth-helpers/admin';

export async function requireUser(req: NextApiRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const shared = parseSharedWalletToken(req);

  if (!token && !shared.valid) return null;

  const email = (token as any)?.email as string | undefined;
  const isAdmin = isAdminEmail(email);

  return {
    userId: (token?.sub as string) || 'dashboard-user',
    email: email || 'dashboard@shared',
    orgId: shared.valid ? shared.orgId || 'shared' : ((token as any)?.orgId || 'personal'),
    role: (token as any)?.role || 'user',
    isAdmin,
  };
}
