# CRAV E-Book Creator - Full Production Build

**Standalone + Dashboard Plugin** | **Next.js Pages Router** | **Credits System** | **AI-Powered**

A complete, production-ready e-book creation platform built with Next.js Pages Router. Supports standalone operation and seamless integration with CRAV unified dashboard via SSO.

---

## ✨ Features

### Core Platform
- 🎨 **E-Book Studio** - AI-powered book creation with outline generation
- ✍️ **TipTap Editor** - Rich text editing with auto-save
- 📚 **Library** - Browse and manage all manuscripts
- ✂️ **Marketing Snippets** - Generate social media, email, ad copy
- 🖼️ **AI Images** - Generate covers and assets with Stability AI / DALL-E
- 📤 **Multi-Format Export** - HTML, EPUB, PDF, DOCX

### Production Features
- 💳 **Credits System** - Usage-based metering with wallet & ledger
- 💰 **Stripe + PayPal** - Multiple payment methods with webhooks
- 🔒 **Rate Limiting** - 60 requests/min per IP
- 🔄 **Idempotency** - 24-hour cache for safe retries
- ✅ **Input Validation** - Zod schemas on all endpoints
- 🎯 **Admin Bypass** - Free usage for designated admins
- 🔌 **Plugin Ready** - Dashboard SSO integration via JWT

### AI Integration
- **Text Providers:** OpenAI GPT-4, Anthropic Claude
- **Image Providers:** Stability AI, DALL-E 3, Placeholder mode
- **Switchable:** Environment variable configuration

### Storage
- **Supabase Storage** - Default, fully integrated
- **AWS S3** - Ready to use (configuration required)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and configure all required variables.

### 3. Set Up Database

```bash
# Apply schema
psql < db/ddl.sql

# Seed data
psql < db/seed.sql
```

### 4. Run Development

```bash
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio)

---

## 📁 Project Structure

```
pages/api/
├── studio/          # E-book APIs
├── snippets/        # Marketing APIs
├── media/           # Image generation
└── billing/         # Payment webhooks

lib/ebooks/
├── schemas.ts       # Zod validation
├── safety.ts        # Rate limit + idempotency
├── ai-providers.ts  # AI integrations
└── storage.ts       # File storage

db/
├── ddl.sql          # Database schema
└── seed.sql         # Initial data
```

---

## 🔌 Dashboard Integration

Plugin manifest at `/public/.well-known/crav-ebook-plugin.json`

SSO via `X-CRAV-SSO` JWT header with shared secret.

---

## 💳 Credits System

| Operation | Credits |
|-----------|---------|
| Outline   | 5       |
| Chapter   | 15      |
| Snippet   | 1       |
| Image     | 5       |
| Export    | 10      |

Admin bypass available via `FREE_ADMIN_BYPASS=1` and `ADMIN_EMAILS`.

---

## 🧪 Testing

```bash
npm run test        # Run tests
npm run typecheck   # Type check
npm run build       # Build verification
```

---

## 🚢 Deployment

### Vercel

```bash
vercel --prod
```

### Configure Webhooks

- Stripe: `https://yourdomain.com/api/billing/stripe/webhook`
- PayPal: `https://yourdomain.com/api/billing/paypal/webhook`

---

## 📊 Complete Feature List

✅ AI-powered outline generation
✅ AI chapter writing
✅ TipTap rich text editor
✅ Manuscript library
✅ Marketing snippet generation
✅ AI image generation
✅ Multi-format exports (HTML/EPUB/PDF/DOCX)
✅ Credits system with wallet
✅ Transaction ledger
✅ Stripe integration
✅ PayPal integration
✅ Rate limiting
✅ Idempotency
✅ Input validation
✅ Admin bypass mode
✅ Dashboard SSO
✅ Plugin manifest
✅ Supabase Storage
✅ S3-ready
✅ Production security

---

**Status:** ✅ Production Ready | 🚀 Ready to Deploy

<!-- Deployment triggered: 2025-10-25 01:27:26 UTC -->
