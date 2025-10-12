# Dashboard Integration & Admin Bypass Guide

## Overview

This patch adds two major features to CRAV E-Book Creator:
1. **Admin Free Usage Bypass** - Admins can use all features without consuming credits
2. **Dashboard Integration** - Plugin-based integration with unified dashboard including SSO and shared wallet support

## Admin Free Usage Bypass

### Configuration

Add to your `.env.local`:
```env
FREE_ADMIN_BYPASS=1
ADMIN_EMAILS=you@yourdomain.com,cofounder@yourdomain.com
```

### How It Works

1. When an admin (listed in `ADMIN_EMAILS`) makes an API request, the system detects their admin status
2. Credit spend operations automatically pass `adminEmailBypass: true`
3. The spend function checks if bypass is enabled and user is admin
4. Instead of deducting credits, it records a zero-cost transaction with `_ADMIN_BYPASS` suffix
5. Admin operations are fully tracked in the ledger for audit purposes

### Affected Operations

All credit-consuming operations bypass charges for admins:
- Outline generation (`EBOOK_OUTLINE_CREDITS`)
- Chapter generation (`EBOOK_CHAPTER_CREDITS`)
- PDF export (`EXPORT_PDF_CREDITS`)
- EPUB export (`EXPORT_EPUB_CREDITS`)
- DOCX export (`EXPORT_DOCX_CREDITS`)

### Ledger Entries

Admin operations appear in the ledger as:
```json
{
  "type": "SPEND",
  "amount": 0,
  "reason": "OUTLINE_ADMIN_BYPASS",
  "meta": { "brief": {...}, "adminEmailBypass": true }
}
```

## Dashboard Integration

### Architecture

The app can be integrated into a unified dashboard using a plugin manifest system:

```
Dashboard → Manifest Discovery → SSO Flow → Shared Wallet Access
```

### Configuration

Required environment variables:
```env
SHARED_DASHBOARD_SECRET=your-long-random-secret-string-min-32-chars
APP_PUBLIC_URL=https://your-deployed-app.com
DASHBOARD_ALLOWED_ORIGINS=https://craudiovizai-dev.netlify.app
```

### Plugin Manifest

Located at: `/.well-known/crav-plugin.json`

The manifest declares:
- Plugin identity and version
- Capabilities (shared credits, SSO, export formats)
- API endpoints for integration
- Entry points for navigation

### SSO Flow

1. **Dashboard initiates SSO**
   ```bash
   POST /api/integrations/dashboard/sso/start
   Content-Type: application/json

   {
     "orgId": "org-123",
     "returnTo": "https://dashboard.com/apps"
   }
   ```

2. **App returns token and URL**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "appUrl": "https://ebook-creator.com/studio",
     "returnTo": "https://dashboard.com/apps"
   }
   ```

3. **Dashboard opens app with token**
   - Opens in iframe or new tab
   - Includes: `Authorization: Bearer <token>`
   - Token valid for 10 minutes

### Shared Wallet

When a request includes the dashboard token:
- `lib/auth-helpers/wallet-hook.ts` parses and validates the JWT
- `lib/session-api.ts` uses the token's `orgId` instead of user's personal org
- All credit operations attribute to the shared wallet
- User operates within shared credit pool

### API Integration

Dashboard can call these APIs with the bearer token:

**Check Balance**
```bash
GET /api/credits/balance
Authorization: Bearer <token>
```

**View Ledger**
```bash
GET /api/credits/ledger?limit=100
Authorization: Bearer <token>
```

**Generate Outline**
```bash
POST /api/studio/outline
Authorization: Bearer <token>
Content-Type: application/json

{
  "brief": {
    "topic": "Sustainable Business",
    "audience": "Entrepreneurs",
    ...
  }
}
```

### CORS Setup

The health endpoint supports CORS for dashboard origins:
```javascript
DASHBOARD_ALLOWED_ORIGINS=https://craudiovizai-dev.netlify.app,https://prod-dashboard.com
```

This allows:
- Dashboard to check app health
- Cross-origin API calls from dashboard frontend
- Secure origin validation

### Health Check

Dashboard can verify app status:
```bash
GET /api/integrations/dashboard/health
Origin: https://craudiovizai-dev.netlify.app
```

Response:
```json
{
  "ok": true,
  "name": "crav-ebook-creator",
  "time": 1697654321000
}
```

## Security Considerations

### Admin Bypass
- Admin emails are stored in environment variables
- Email comparison is case-insensitive
- All admin actions are logged with `_ADMIN_BYPASS` suffix
- Credits are not deducted but transactions are recorded

### Dashboard Integration
- JWT tokens are signed with `SHARED_DASHBOARD_SECRET`
- Tokens expire after 10 minutes
- Token includes `mode: "shared"` for validation
- CORS is strictly enforced based on `DASHBOARD_ALLOWED_ORIGINS`
- Shared secret should be rotated if compromised

### Best Practices
1. Use strong random strings for `SHARED_DASHBOARD_SECRET` (min 32 chars)
2. Rotate secrets periodically
3. Monitor admin bypass usage in ledger
4. Restrict `DASHBOARD_ALLOWED_ORIGINS` to trusted domains
5. Use HTTPS in production for `APP_PUBLIC_URL`

## Testing

### Test Admin Bypass

1. Add your email to `ADMIN_EMAILS`
2. Enable bypass: `FREE_ADMIN_BYPASS=1`
3. Sign in and perform operations
4. Check credits ledger - should show `0` amount with `_ADMIN_BYPASS` suffix

### Test Dashboard Integration

1. Configure environment variables
2. Access manifest: `curl http://localhost:3000/.well-known/crav-plugin.json`
3. Test health check: `curl http://localhost:3000/api/integrations/dashboard/health`
4. Generate SSO token:
   ```bash
   curl -X POST http://localhost:3000/api/integrations/dashboard/sso/start \
     -H "Content-Type: application/json" \
     -d '{"orgId":"test-org-123"}'
   ```
5. Use token to call API:
   ```bash
   curl http://localhost:3000/api/credits/balance \
     -H "Authorization: Bearer <token>"
   ```

## File Structure

New files added:
```
lib/auth-helpers/
  ├── admin.ts              # Admin email checking and bypass logic
  └── wallet-hook.ts        # Dashboard JWT token parsing

lib/session-api.ts          # API request session handling with token support

pages/api/integrations/dashboard/
  ├── health.ts             # Health check endpoint with CORS
  ├── manifest.ts           # Manifest mirror endpoint
  └── sso/
      └── start.ts          # SSO token generation

public/.well-known/
  └── crav-plugin.json      # Plugin manifest for dashboard discovery
```

Modified files:
```
lib/credits.ts              # Added admin bypass logic to spend()
pages/api/credits/balance.ts    # Uses new session-api
pages/api/credits/ledger.ts     # Uses new session-api
pages/api/studio/outline.ts     # Uses new session-api + admin flag
pages/api/studio/chapter.ts     # Uses new session-api + admin flag
pages/api/studio/export.ts      # Uses new session-api + admin flag
.env.local.example              # Added new environment variables
README.md                       # Added integration documentation
```

## Troubleshooting

### Admin Bypass Not Working
- Verify `FREE_ADMIN_BYPASS=1` is set
- Check email matches exactly (case-insensitive)
- Look for `_ADMIN_BYPASS` suffix in ledger entries
- Ensure admin email is comma-separated if multiple

### Dashboard Token Invalid
- Check `SHARED_DASHBOARD_SECRET` matches dashboard
- Verify token hasn't expired (10min lifetime)
- Ensure token includes `mode: "shared"` claim
- Check token is sent as `Authorization: Bearer <token>`

### CORS Errors
- Verify dashboard origin in `DASHBOARD_ALLOWED_ORIGINS`
- Ensure origins are comma-separated
- Check for trailing slashes in origins
- Confirm dashboard sends proper `Origin` header

## Next Steps

1. Deploy app with new environment variables
2. Share manifest URL with dashboard team
3. Test SSO flow end-to-end
4. Monitor admin usage in ledger
5. Set up credit monitoring for shared wallets
