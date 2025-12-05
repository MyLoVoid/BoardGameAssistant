# BGAI Admin Portal - Quick Setup Guide

## Quick Start (3 steps)

### 1. Install Dependencies
```bash
cd admin-portal
npm install
```

### 2. Ensure Supabase is Running

Make sure Supabase is running with test users:

```bash
# From project root
npx supabase status

# If not running:
npx supabase start

# Reset database to create test users (if needed):
npx supabase db reset
```

**Test users are automatically created** after `supabase db reset`. You can use:
- **Email**: `admin@bgai.test`
- **Password**: `Admin123!`

Other test users available:
- `developer@bgai.test` / `Dev123!` (developer role)
- `tester@bgai.test` / `Test123!` (tester role)
- `premium@bgai.test` / `Premium123!` (premium role)
- `basic@bgai.test` / `Basic123!` (basic role)

### 3. Start Development Server
```bash
npm run dev
```

Then open: **http://localhost:3000**

Login with:
- Email: `admin@bgai.test`
- Password: `Admin123!`

## Prerequisites Checklist

Before starting the admin portal, make sure:

- [ ] Supabase is running: `npx supabase status` (from project root)
- [ ] Backend API is running: `http://127.0.0.1:8000` should respond
- [ ] Test users exist: Run `npx supabase db reset` to create them
- [ ] Node.js 18+ installed: `node --version`

## Common Issues

### "Unauthorized" on Login
- Check user role is `admin` or `developer` in `public.users` table
- Verify Supabase is running: `npx supabase status`

### Backend API Errors
- Ensure FastAPI backend is running: `cd backend && uvicorn main:app --reload`
- Check backend logs for errors

### Port 3000 Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Images Not Loading
- BGG images require internet connection
- Check Next.js config allows `cf.geekdo-images.com` domain

## Development Workflow

### Typical Admin Tasks

1. **Import a game from BGG**
   - Games → Import from BGG
   - Enter BGG ID (e.g., 174430 for Gloomhaven)
   - Select section and status

2. **Add FAQs**
   - Open game → FAQs tab
   - Click "Add FAQ"
   - Fill in question/answer (supports ES/EN)

3. **Add documents**
   - Open game → Documents tab
   - Click "Add Document"
   - Fill in metadata
   - Upload file to Supabase Storage (manual for now)
   - Select documents and click "Process Knowledge"

### Project Structure

```
admin-portal/
├── app/                    # Next.js pages (App Router)
│   ├── (dashboard)/        # Protected routes
│   ├── auth/login/         # Login page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── games/              # Game management
│   ├── layout/             # Layout components
│   └── ui/                 # Reusable UI
├── lib/                    # Utilities
│   ├── api.ts              # Backend API client
│   ├── supabase.ts         # Supabase client
│   └── types.ts            # TypeScript types
└── middleware.ts           # Auth middleware
```

## API Endpoints Used

The portal connects to `http://127.0.0.1:8000`:

**Admin Endpoints (require auth + admin role):**
- `POST /admin/games/import-bgg` - Import from BGG
- `PATCH /admin/games/{id}` - Update game
- `POST /admin/games/{id}/sync-bgg` - Sync from BGG
- `POST /admin/games/{id}/faqs` - Create FAQ
- `PATCH /admin/games/{id}/faqs/{faq_id}` - Update FAQ
- `DELETE /admin/games/{id}/faqs/{faq_id}` - Delete FAQ
- `POST /admin/games/{id}/documents` - Create document
- `POST /admin/games/{id}/process-knowledge` - Process documents

**Public Endpoints:**
- `GET /games` - List games
- `GET /games/{id}` - Get game
- `GET /games/{id}/faqs` - Get FAQs

## Environment Variables

`.env` (already configured):
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_ENVIRONMENT=dev
```

## Testing the Portal

### 1. Test Authentication
- [ ] Can login with admin user
- [ ] Can see user email in header
- [ ] Can logout successfully

### 2. Test Game Management
- [ ] Can see games list
- [ ] Can import game from BGG (try BGG ID: 174430)
- [ ] Can view game details
- [ ] Can edit game information
- [ ] Can sync game from BGG

### 3. Test FAQ Management
- [ ] Can create FAQ in Spanish
- [ ] Can create FAQ in English
- [ ] Can edit existing FAQ
- [ ] Can delete FAQ
- [ ] Can toggle FAQ visibility

### 4. Test Document Management
- [ ] Can create document reference
- [ ] Can view document list
- [ ] Can delete document
- [ ] Can select documents for processing

## Next Steps

After setup:
1. Import your first game (e.g., Gloomhaven: BGG ID 174430)
2. Add some FAQs in both languages
3. Create document references
4. Test the mobile app to see changes

## Getting Help

- Check main project README
- Review backend API docs
- Check browser console for errors
- Review Supabase logs: `npx supabase logs`

## Production Deployment

For production (future):
1. Update `.env` with production Supabase URL
2. Set `NEXT_PUBLIC_API_URL` to production backend
3. Build: `npm run build`
4. Deploy to Vercel/Netlify or self-host

**Note**: Remember to update CORS settings in backend for production domain.
