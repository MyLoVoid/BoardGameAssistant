# BGAI - Deployment Guide

> **Version**: 2024-12-05
> **Status**: Supabase Cloud migration in progress

## Overview

This document covers the deployment process for Board Game Assistant Intelligent (BGAI), including Supabase Cloud setup, environment configuration, and deployment strategies for each component.

## Table of Contents

1. [Supabase Cloud Setup](#supabase-cloud-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Migration](#database-migration)
4. [Backend Deployment](#backend-deployment)
5. [Admin Portal Deployment](#admin-portal-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Verification & Testing](#verification--testing)

---

## 1. Supabase Cloud Setup

### 1.1 Project Information

**Current Production Project:**
- **URL**: `https://cszvpobhylbzsfrbanbl.supabase.co`
- **Project Ref**: `cszvpobhylbzsfrbanbl`
- **Region**: (check dashboard for specific region)

### 1.2 Initial Setup

1. **Access the Supabase Dashboard**:
   - Navigate to: https://supabase.com/dashboard/project/cszvpobhylbzsfrbanbl
   - Ensure you have admin access to the project

2. **Retrieve API Keys**:
   - Go to: **Settings → API**
   - Copy the following values:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` key → `SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep secret!)
   - Go to: **Settings → API → JWT Settings**
     - Copy `JWT Secret` → `SUPABASE_JWT_SECRET`

3. **Database Configuration**:
   - Go to: **Settings → Database**
   - Note the **Postgres Version** (should match `supabase/config.toml` major_version)
   - Copy **Connection string** (Direct connection) → `DATABASE_URL`

### 1.3 Link Local Project to Cloud

```bash
# Link your local Supabase CLI to the cloud project
supabase link --project-ref cszvpobhylbzsfrbanbl

# Verify the link
supabase projects list
```

**Expected output:**
```
┌────────────────────────┬──────────────────────┬─────────────────────────────┐
│ NAME                   │ PROJECT REF          │ ORGANIZATION                │
├────────────────────────┼──────────────────────┼─────────────────────────────┤
│ Board Game Assistant   │ cszvpobhylbzsfrbanbl │ (your organization)         │
└────────────────────────┴──────────────────────┴─────────────────────────────┘
```

---

## 2. Environment Configuration

### 2.1 Backend (.env)

Create a `.env` file in the `backend/` directory for production:

```bash
# Backend .env (Production)
ENVIRONMENT=prod
DEBUG=false
NODE_ENV=production

# Backend API
HOST=0.0.0.0
PORT=8000
RELOAD=false

# Supabase Cloud
SUPABASE_URL=https://cszvpobhylbzsfrbanbl.supabase.co
SUPABASE_ANON_KEY=<your-cloud-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-cloud-service-role-key>
SUPABASE_JWT_SECRET=<your-cloud-jwt-secret>

# Database (optional - for direct connections)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.cszvpobhylbzsfrbanbl.supabase.co:5432/postgres

# AI Providers
OPENAI_API_KEY=<your-openai-key>
GOOGLE_API_KEY=<your-google-key>
ANTHROPIC_API_KEY=<your-anthropic-key>

DEFAULT_AI_PROVIDER=openai
DEFAULT_MODEL=gpt-4-turbo-preview

# BGG Integration (⚠️ pending license approval)
BGG_API_URL=https://www.boardgamegeek.com/xmlapi2
BGG_API_TOKEN=<your-bgg-token-if-approved>

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60

# CORS (update with your deployed domains)
CORS_ORIGINS=https://admin.yourdomain.com,https://api.yourdomain.com
CORS_ALLOW_CREDENTIALS=true

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### 2.2 Admin Portal (.env.local)

Create `.env.local` in `admin-portal/`:

```bash
# Admin Portal .env.local (Production)
NEXT_PUBLIC_SUPABASE_URL=https://cszvpobhylbzsfrbanbl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-cloud-anon-key>
NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # Your deployed backend URL

# Optional: Analytics, monitoring
NEXT_PUBLIC_ENV=prod
```

### 2.3 Mobile App (.env)

Update `mobile/.env` for production builds:

```bash
# Mobile .env (Production)
EXPO_PUBLIC_SUPABASE_URL=https://cszvpobhylbzsfrbanbl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-cloud-anon-key>
EXPO_PUBLIC_BACKEND_URL=https://api.yourdomain.com  # Your deployed backend URL
```

---

## 3. Database Migration

### 3.1 Apply Baseline Migration to Cloud

⚠️ **IMPORTANT**: Before applying migrations to production:
1. Create a backup of the cloud database
2. Test migrations in a staging project first
3. Schedule deployment during low-traffic periods

```bash
# Verify migration status
supabase db remote list

# Push migrations to cloud (⚠️ DESTRUCTIVE - applies all migrations)
supabase db push

# Verify migrations were applied
supabase db remote list
```

**Expected output:**
```
┌───────────────────────────┬────────────────────────┐
│ VERSION                   │ NAME                   │
├───────────────────────────┼────────────────────────┤
│ 20251205000000            │ baseline               │
└───────────────────────────┴────────────────────────┘
```

### 3.2 Seed Data Strategy

⚠️ **CRITICAL**: The `supabase/seed.sql` file contains **test users** that should **NOT** be applied to production.

**For Development/Staging:**
```bash
# Apply seed data (includes test users)
supabase db reset --db-url postgresql://...
```

**For Production:**

1. **Manual user creation** via Supabase Dashboard or custom scripts
2. **Selective data seeding**:

```bash
# Connect to cloud database
psql $DATABASE_URL

-- Apply ONLY production-safe seeds
-- 1. Insert BGC section
INSERT INTO public.app_sections (key, name, description, display_order, enabled)
SELECT 'BGC', 'Board Game Companion', 'Your intelligent assistant for board games', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.app_sections WHERE key = 'BGC');

-- 2. Insert feature flags (prod environment only)
-- Copy feature flag inserts from seed.sql but ONLY for environment='prod'

-- 3. DO NOT insert test users from seed.sql
-- Instead, create real admin users via Supabase Dashboard → Authentication
```

### 3.3 Storage Buckets

Create the `game_documents` storage bucket in the cloud:

1. Go to: **Storage** in Supabase Dashboard
2. Create new bucket:
   - Name: `game_documents`
   - Public: `false` (private bucket)
   - File size limit: `50 MB`
   - Allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

3. Set bucket policies (SQL Editor):

```sql
-- Allow authenticated users to read game documents
CREATE POLICY "Allow authenticated users to read game_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'game_documents');

-- Allow admins/developers to upload game documents
CREATE POLICY "Allow admins to upload game_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game_documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('admin', 'developer')
);

-- Allow admins/developers to delete game documents
CREATE POLICY "Allow admins to delete game_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'game_documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('admin', 'developer')
);
```

---

## 4. Backend Deployment

### 4.1 Recommended Platforms

**Option A: Railway**
- Good Python support
- Automatic deployments from GitHub
- Built-in Postgres if needed

**Option B: Render**
- Free tier available
- Easy environment variable management
- Supports Docker

**Option C: Fly.io**
- Global edge deployment
- Excellent for low-latency
- Supports WebSockets

### 4.2 Deployment Steps (Railway Example)

1. **Prepare the backend**:
```bash
cd backend

# Ensure pyproject.toml is up to date
poetry lock

# Test production build locally
poetry install --no-dev
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

2. **Create Railway project**:
   - Connect GitHub repository
   - Select `backend/` as root directory
   - Railway auto-detects Python

3. **Configure environment variables** in Railway dashboard:
   - Add all variables from section 2.1

4. **Deploy**:
   - Railway deploys automatically on push to main
   - Get deployment URL: `https://your-backend.railway.app`

5. **Update CORS origins** in `.env` to include frontend domains

### 4.3 Health Check

Verify deployment:
```bash
# Check health endpoint
curl https://your-backend.railway.app/health

# Expected response
{"status": "ok", "version": "1.0.0"}
```

---

## 5. Admin Portal Deployment

### 5.1 Recommended Platform: Vercel

Vercel provides excellent Next.js support with automatic deployments.

### 5.2 Deployment Steps

1. **Connect repository to Vercel**:
   - Go to https://vercel.com/new
   - Import GitHub repository
   - Root directory: `admin-portal/`
   - Framework preset: `Next.js`

2. **Configure environment variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cszvpobhylbzsfrbanbl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-cloud-anon-key>
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_ENV=prod
   ```

3. **Deploy**:
   - Vercel deploys automatically
   - Get deployment URL: `https://admin-bgai.vercel.app`

4. **Custom domain (optional)**:
   - Add custom domain in Vercel settings
   - Update DNS records as instructed

### 5.3 Verification

1. Access admin portal URL
2. Login with a real admin account (created via Supabase Dashboard)
3. Verify:
   - ✅ Authentication works
   - ✅ Games list loads
   - ✅ BGG import works
   - ✅ Document upload works

---

## 6. Mobile App Deployment

### 6.1 Update Environment Variables

Update `mobile/.env` with production values (from section 2.3).

### 6.2 Build for Production

**Android:**
```bash
cd mobile

# Update app.json with correct version
# Increment "versionCode" and "version"

# Build APK (for testing)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production
```

**iOS:**
```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

### 6.3 Submit to Stores

Follow standard Expo EAS submission process:
- Android: Google Play Console
- iOS: App Store Connect via TestFlight

---

## 7. Verification & Testing

### 7.1 Post-Deployment Checklist

- [ ] **Supabase Cloud**:
  - [ ] Migrations applied successfully
  - [ ] Storage buckets created
  - [ ] RLS policies active
  - [ ] Feature flags configured
  - [ ] Admin users created

- [ ] **Backend API**:
  - [ ] Health check passes
  - [ ] `/games` endpoint returns data
  - [ ] `/genai/query` endpoint works
  - [ ] Authentication validates tokens
  - [ ] Rate limiting active

- [ ] **Admin Portal**:
  - [ ] Login works
  - [ ] Games management works
  - [ ] FAQ management works
  - [ ] Document upload/download works
  - [ ] "Process Knowledge" triggers RAG pipeline

- [ ] **Mobile App**:
  - [ ] Login works
  - [ ] Games list loads
  - [ ] Game detail shows FAQs
  - [ ] Chat sends questions and receives answers
  - [ ] Language switching works (ES/EN)

### 7.2 Monitoring

**Supabase Dashboard:**
- Monitor database usage: **Database → Usage**
- Monitor API requests: **API → Logs**
- Monitor storage: **Storage → Usage**

**Backend Logs:**
- Railway: **Deployments → Logs**
- Check for errors and performance issues

**Error Tracking (recommended):**
- Sentry for backend and admin portal
- Crashlytics for mobile app

---

## 8. Migration from Local to Cloud

### 8.1 Data Export from Local

If you have local data you want to migrate:

```bash
# Export local database
supabase db dump -f local_backup.sql

# Connect to cloud
supabase link --project-ref cszvpobhylbzsfrbanbl

# Import to cloud (⚠️ review SQL first)
psql $DATABASE_URL < local_backup.sql
```

### 8.2 Storage Migration

For documents in local storage:

1. Download files from local Supabase Storage
2. Upload to cloud storage via Admin Portal or API
3. Update `game_documents` table references

---

## 9. Rollback Strategy

In case of issues during deployment:

### 9.1 Database Rollback

⚠️ **BEFORE migration**, create a backup:

```bash
# Create backup before pushing
supabase db dump --db-url postgresql://... -f pre_migration_backup.sql

# If rollback needed
psql $DATABASE_URL < pre_migration_backup.sql
```

### 9.2 Application Rollback

- **Railway/Render**: Use platform rollback feature
- **Vercel**: Revert to previous deployment in dashboard
- **Mobile**: Cannot rollback published app, plan for hotfix

---

## 10. Environment Comparison

| Aspect | Local Dev | Supabase Cloud |
|--------|-----------|----------------|
| **Database** | `127.0.0.1:54322` | `db.cszvpobhylbzsfrbanbl.supabase.co` |
| **API** | `127.0.0.1:54321` | `https://cszvpobhylbzsfrbanbl.supabase.co` |
| **Backend** | `localhost:8000` | `https://your-backend.railway.app` |
| **Admin Portal** | `localhost:3000` | `https://admin-bgai.vercel.app` |
| **Mobile** | `10.0.2.2:8000` (Android emulator) | `https://your-backend.railway.app` |
| **Seed Data** | Test users included | Manual admin creation |
| **Feature Flags** | `environment='dev'` | `environment='prod'` |

---

## 11. Troubleshooting

### Issue: Migration fails

```bash
# Check current migration status
supabase db remote list

# Check for errors
supabase db push --debug
```

### Issue: RLS policies blocking access

```bash
# Temporarily disable RLS for debugging (⚠️ DEV ONLY)
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;

# Re-enable after testing
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
```

### Issue: CORS errors in Admin Portal

- Verify `CORS_ORIGINS` in backend `.env` includes portal URL
- Check browser console for specific blocked origins

### Issue: Mobile app can't connect to backend

- Verify `EXPO_PUBLIC_BACKEND_URL` is correct
- Check backend CORS settings
- Verify network connectivity

---

## 12. Next Steps

1. **Complete Supabase migration**:
   - [ ] Apply baseline migration to cloud
   - [ ] Create production admin users
   - [ ] Set up storage buckets and policies

2. **Deploy backend**:
   - [ ] Choose hosting platform
   - [ ] Configure environment variables
   - [ ] Deploy and verify endpoints

3. **Deploy Admin Portal**:
   - [ ] Deploy to Vercel
   - [ ] Configure environment variables
   - [ ] Test full workflow

4. **Prepare mobile builds**:
   - [ ] Update production environment variables
   - [ ] Create production builds
   - [ ] Submit to app stores (when ready)

5. **Set up monitoring**:
   - [ ] Configure error tracking (Sentry)
   - [ ] Set up usage analytics
   - [ ] Create alerting for critical errors

---

## 13. Security Considerations

⚠️ **IMPORTANT**:

1. **Never commit secrets**:
   - `.env` files are in `.gitignore`
   - Use platform-specific secret management
   - Rotate keys if accidentally exposed

2. **RLS Policies**:
   - Verify all tables have RLS enabled
   - Test access patterns for each role
   - Regularly audit policies

3. **API Keys**:
   - Store in environment variables only
   - Use service role key only in backend
   - Never expose service role key to frontend/mobile

4. **BGG Integration**:
   - Still pending license approval
   - Keep BGG_API_TOKEN secret
   - Monitor rate limits

---

## References

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Railway Deployment](https://docs.railway.app/)
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)

---

**Last Updated**: 2024-12-05
**Document Owner**: BGAI Development Team
