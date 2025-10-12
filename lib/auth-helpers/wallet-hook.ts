import jwt from 'jsonwebtoken';

export function parseSharedWalletToken(req: any): {
  orgId?: string;
  valid: boolean;
} {
  try {
    const hdr = (req.headers['authorization'] as string) || '';
    const alt = (req.headers['x-dashboard-token'] as string) || '';
    const tok = hdr.startsWith('Bearer ') ? hdr.slice(7) : alt;

    if (!tok) return { valid: false };

    const secret = process.env.SHARED_DASHBOARD_SECRET;
    if (!secret) return { valid: false };

    const payload = jwt.verify(tok, secret) as any;
    if (payload?.mode !== 'shared') return { valid: false };

    return { valid: true, orgId: String(payload.orgId || '') };
  } catch {
    return { valid: false };
  }
}
