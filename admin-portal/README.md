# BGAI Admin Portal

Board Game Assistant Intelligent - Administration Portal

A Next.js-based web portal for managing games, FAQs, and knowledge documents for the BGAI mobile application.

## Features

- **Authentication**: Secure login with Supabase Auth (admin/developer roles only)
- **Game Management**:
  - Import games from BoardGameGeek (BGG)
  - Edit game metadata and information
  - Sync game data from BGG
- **FAQ Management**: Create, edit, and delete FAQs in multiple languages (ES/EN)
- **Document Management**:
  - Add document references for game knowledge
  - Process documents for RAG (Retrieval Augmented Generation)
  - Support for multiple AI providers (OpenAI, Gemini, Claude)
- **Multi-language Support**: Spanish (ES) and English (EN)
- **Responsive Design**: Desktop-first design optimized for admin workflows

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **API Client**: Axios
- **Form Management**: React Hook Form
- **Validation**: Zod
- **Icons**: Lucide React

## Prerequisites

Before running the admin portal, ensure you have:

1. **Node.js**: Version 18.x or higher
2. **Supabase**: Local instance running (see main project README)
3. **Backend API**: FastAPI backend running at `http://127.0.0.1:8000`
4. **Admin User**: A user account with `admin` or `developer` role in Supabase

## Setup Instructions

### 1. Install Dependencies

```bash
cd admin-portal
npm install
```

### 2. Configure Environment Variables

The `.env.local` file should already be configured with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Environment
NEXT_PUBLIC_ENVIRONMENT=dev
NODE_ENV=development
```

### 3. Ensure Test Users Exist

Test users are automatically created after `npx supabase db reset`. You can use:

**Admin user:**
- Email: `admin@bgai.test`
- Password: `Admin123!`
- Role: admin

**Other test users available:**
- `developer@bgai.test` / `Dev123!` (developer role)
- `tester@bgai.test` / `Test123!` (tester role)
- `premium@bgai.test` / `Premium123!` (premium role)
- `basic@bgai.test` / `Basic123!` (basic role)

If test users don't exist, run from project root:
```bash
npx supabase db reset
```

This will recreate the database with all test users from `supabase/seed.sql`.

### 4. Start the Development Server

```bash
npm run dev
```

The portal will be available at: **http://localhost:3000**

## Usage Guide

### Login

1. Navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. Enter your admin credentials
4. Only users with `admin` or `developer` roles can access

### Importing a Game from BGG

1. Go to **Games** section
2. Click **Import from BGG** button
3. Enter the BoardGameGeek ID (e.g., `174430` for Gloomhaven)
4. Select the section and initial status
5. Click **Import Game**

The system will fetch game data from BGG API and create the game in the database.

### Managing Game Information

1. Click on a game from the list
2. Go to **Home** tab
3. Click **Edit** to modify game details
4. Use **Sync from BGG** to refresh data from BoardGameGeek

### Managing FAQs

1. Open a game detail page
2. Go to **FAQs** tab
3. Filter by language (All, Spanish, English)
4. Click **Add FAQ** to create a new FAQ
5. Edit or delete existing FAQs as needed

FAQ fields:
- **Language**: ES or EN
- **Question**: The FAQ question
- **Answer**: The FAQ answer (supports line breaks)
- **Order**: Display order (lower numbers appear first)
- **Visible**: Whether the FAQ is shown to end users

### Managing Documents

1. Open a game detail page
2. Go to **Documents** tab
3. Click **Add Document** to create a document reference

Document fields:
- **Language**: ES or EN
- **Source Type**: rulebook, faq, expansion, quickstart, reference, other
- **File Name**: Name of the document file
- **File Path**: Path in Supabase Storage (optional)
- **AI Provider**: openai, gemini, or claude

#### Processing Knowledge

After adding documents and uploading files to Supabase Storage:

1. Select the documents you want to process (checkbox)
2. Click **Process Knowledge**
3. The backend will upload documents to the AI provider and create vector stores

This enables RAG (Retrieval Augmented Generation) for AI-powered game assistance.

## Project Structure

```
admin-portal/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected routes group
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── dashboard/            # Dashboard home
│   │   └── games/                # Games management
│   │       ├── page.tsx          # Games list
│   │       └── [id]/             # Game detail
│   │           └── page.tsx      # Game detail with tabs
│   ├── auth/                     # Authentication routes
│   │   └── login/                # Login page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── auth/                     # Auth components
│   ├── games/                    # Game-specific components
│   │   ├── import-bgg-modal.tsx  # BGG import modal
│   │   ├── game-info-tab.tsx    # Game info tab
│   │   ├── faq-tab.tsx          # FAQ management tab
│   │   └── documents-tab.tsx    # Document management tab
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx          # Navigation sidebar
│   │   └── header.tsx           # Top header with user info
│   └── ui/                       # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
├── lib/                          # Utilities and helpers
│   ├── supabase.ts              # Supabase client and auth helpers
│   ├── api.ts                   # Backend API client
│   ├── types.ts                 # TypeScript type definitions
│   └── utils.ts                 # Utility functions
├── middleware.ts                # Next.js middleware (auth protection)
├── .env.local                   # Environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project dependencies
```

## API Integration

The portal consumes the FastAPI backend at `http://127.0.0.1:8000`:

### Admin Endpoints Used

- `POST /admin/games/import-bgg` - Import game from BGG
- `POST /admin/games` - Create game manually
- `PATCH /admin/games/{id}` - Update game
- `POST /admin/games/{id}/sync-bgg` - Sync game from BGG
- `POST /admin/games/{id}/faqs` - Create FAQ
- `PATCH /admin/games/{id}/faqs/{faq_id}` - Update FAQ
- `DELETE /admin/games/{id}/faqs/{faq_id}` - Delete FAQ
- `POST /admin/games/{id}/documents` - Create document reference
- `DELETE /admin/games/{id}/documents/{doc_id}` - Delete document
- `POST /admin/games/{id}/process-knowledge` - Process documents for RAG

### Public Endpoints Used

- `GET /games` - List all games
- `GET /games/{id}` - Get game details
- `GET /games/{id}/faqs` - Get game FAQs
- `GET /sections` - Get app sections

All admin endpoints require authentication with a Supabase JWT token and admin/developer role.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Troubleshooting

### "Unauthorized" Error on Login

- Ensure your user has `admin` or `developer` role in the `public.users` table
- Check that Supabase is running (`npx supabase status`)
- Verify environment variables in `.env.local`

### Backend API Errors

- Ensure FastAPI backend is running at `http://127.0.0.1:8000`
- Check backend logs for detailed error messages
- Verify your Supabase session token is valid

### Import from BGG Fails

- Verify the BGG ID is correct
- Check that the backend can access boardgamegeek.com API
- Some games may have restricted data on BGG

### Image Loading Issues

- BGG images are loaded from `cf.geekdo-images.com`
- Ensure the Next.js image configuration allows this domain
- Check browser console for CORS or loading errors

## Security Notes

- **Internal Use Only**: This portal is for admin/developer use only
- **No Public Access**: All routes are protected by authentication middleware
- **Role-Based Access**: Only admin and developer roles can access
- **Token Validation**: Backend validates Supabase JWT on every request
- **No Sensitive Data**: Never hardcode API keys or secrets in the frontend

## Future Enhancements

Potential improvements for future versions:

- **File Upload UI**: Direct file upload to Supabase Storage
- **Dashboard Stats**: Real-time analytics and usage statistics
- **User Management**: Admin interface for managing users and roles
- **Bulk Operations**: Import multiple games, batch document processing
- **Preview Mode**: Preview how games/FAQs appear in mobile app
- **Audit Logs**: Track changes and admin actions
- **Advanced Search**: Full-text search across games and FAQs
- **Image Management**: Upload and crop game images
- **Multi-language Content Editor**: Rich text editor for FAQs and descriptions

## Documentation

Additional documentation for the admin portal:

- **[SETUP.md](SETUP.md)** - Quick setup guide (3 steps)
- **[ADMIN_PORTAL_COMPLETE.md](ADMIN_PORTAL_COMPLETE.md)** - Executive summary and quick reference
- **[admin-portal-checklist.md](admin-portal-checklist.md)** - Feature verification checklist
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Implementation details and statistics
- **[../docs/BGAI-0010_admin-portal-backend.md](../docs/BGAI-0010_admin-portal-backend.md)** - Technical docs for backend API
- **[../docs/BGAI-0011_admin-portal-frontend.md](../docs/BGAI-0011_admin-portal-frontend.md)** - Technical docs for frontend (this portal)
- **[../supabase/seed.sql](../supabase/seed.sql)** - Test users created here automatically

## Support

For issues or questions:
1. Check [SETUP.md](SETUP.md) for quick fixes
2. Review [ADMIN_PORTAL_COMPLETE.md](ADMIN_PORTAL_COMPLETE.md) for troubleshooting
3. Check the main project [README](../README.md)
4. Review backend API documentation in `../docs/`
5. Check Supabase logs for auth issues
6. Review browser console for frontend errors

## License

Part of the BGAI (Board Game Assistant Intelligent) project.
