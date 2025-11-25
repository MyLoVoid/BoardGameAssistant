---
description: 'Next.js Admin Portal Development: App Router, React Server Components, Tailwind CSS'
applyTo: 'admin-portal/**/*.{ts,tsx}'
---

# Next.js Admin Frontend Expert Instructions

Use these guidelines when working on the admin portal frontend with Next.js.

## Scope

This applies to:
- Next.js pages and layouts (`admin-portal/app/`)
- React components (`admin-portal/components/`)
- Server actions (`admin-portal/app/actions/`)
- API route handlers (`admin-portal/app/api/`)
- Utility functions (`admin-portal/lib/`)

## Core Principles

### 1. App Router Architecture

**Server Components (Default)**
```tsx
// admin-portal/app/games/page.tsx
import { Suspense } from 'react';
import { getGames } from '@/lib/api/games';
import { GamesList } from '@/components/games/GamesList';
import { GamesListSkeleton } from '@/components/games/GamesListSkeleton';

export default async function GamesPage() {
  // Fetch data in Server Component
  const games = await getGames();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Games Management</h1>
      
      <Suspense fallback={<GamesListSkeleton />}>
        <GamesList games={games} />
      </Suspense>
    </div>
  );
}
```

**Client Components (When Needed)**
```tsx
// admin-portal/components/games/GameForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame } from '@/app/actions/games';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface GameFormProps {
  initialData?: Game;
}

export function GameForm({ initialData }: GameFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      await createGame(formData);
      router.push('/games');
      router.refresh(); // Revalidate server components
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="bgg_id"
        label="BoardGameGeek ID"
        type="number"
        required
        defaultValue={initialData?.bgg_id}
      />
      
      <Input
        name="name_base"
        label="Game Name"
        required
        defaultValue={initialData?.name_base}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading}>
        {initialData ? 'Update Game' : 'Create Game'}
      </Button>
    </form>
  );
}
```

### 2. Server Actions

**Data Mutations**
```tsx
// admin-portal/app/actions/games.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { adminApi } from '@/lib/api/admin';

export async function createGame(formData: FormData) {
  // Check authentication
  const session = await getServerSession();
  if (!session || !['admin', 'developer'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  // Extract and validate data
  const bggId = formData.get('bgg_id');
  const nameBase = formData.get('name_base');

  if (!bggId || !nameBase) {
    throw new Error('Missing required fields');
  }

  // Call backend API
  try {
    await adminApi.createGame({
      bgg_id: parseInt(bggId.toString()),
      name_base: nameBase.toString(),
      status: 'active',
    });

    // Revalidate and redirect
    revalidatePath('/games');
    redirect('/games');
  } catch (error) {
    throw new Error('Failed to create game');
  }
}

export async function importGameFromBGG(bggId: number) {
  const session = await getServerSession();
  if (!session || !['admin', 'developer'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const game = await adminApi.importFromBGG(bggId);
  
  revalidatePath('/games');
  return game;
}

export async function uploadGameDocument(
  gameId: string,
  formData: FormData
) {
  const session = await getServerSession();
  if (!session || !['admin', 'developer'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File;
  const language = formData.get('language') as string;
  const sourceType = formData.get('source_type') as string;

  if (!file || !language || !sourceType) {
    throw new Error('Missing required fields');
  }

  await adminApi.uploadDocument(gameId, file, { language, sourceType });
  
  revalidatePath(`/games/${gameId}/documents`);
}
```

### 3. Tailwind CSS Styling

**Utility-First Approach**
```tsx
// admin-portal/components/ui/Card.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        hover && 'transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('border-b border-gray-200 px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn('border-t border-gray-200 px-6 py-4', className)}>
      {children}
    </div>
  );
}
```

**Responsive Design**
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {games.map((game) => (
    <GameCard key={game.id} game={game} />
  ))}
</div>
```

**Theme Configuration**
```js
// admin-portal/tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 4. Form Handling

**Controlled Form with React Hook Form**
```tsx
// admin-portal/components/games/GameSettingsForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateGameSettings } from '@/app/actions/games';

const gameSettingsSchema = z.object({
  name_base: z.string().min(1, 'Name is required'),
  status: z.enum(['active', 'beta', 'hidden']),
  min_players: z.number().min(1).max(10),
  max_players: z.number().min(1).max(10),
});

type GameSettingsFormData = z.infer<typeof gameSettingsSchema>;

interface GameSettingsFormProps {
  game: Game;
}

export function GameSettingsForm({ game }: GameSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GameSettingsFormData>({
    resolver: zodResolver(gameSettingsSchema),
    defaultValues: {
      name_base: game.name_base,
      status: game.status,
      min_players: game.min_players || 1,
      max_players: game.max_players || 4,
    },
  });

  const onSubmit = async (data: GameSettingsFormData) => {
    await updateGameSettings(game.id, data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name_base" className="block text-sm font-medium text-gray-700">
          Game Name
        </label>
        <input
          {...register('name_base')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
        {errors.name_base && (
          <p className="mt-1 text-sm text-red-600">{errors.name_base.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          {...register('status')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="active">Active</option>
          <option value="beta">Beta</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="min_players" className="block text-sm font-medium text-gray-700">
            Min Players
          </label>
          <input
            {...register('min_players', { valueAsNumber: true })}
            type="number"
            min="1"
            max="10"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          {errors.min_players && (
            <p className="mt-1 text-sm text-red-600">{errors.min_players.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="max_players" className="block text-sm font-medium text-gray-700">
            Max Players
          </label>
          <input
            {...register('max_players', { valueAsNumber: true })}
            type="number"
            min="1"
            max="10"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          {errors.max_players && (
            <p className="mt-1 text-sm text-red-600">{errors.max_players.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

### 5. API Client

**Backend Integration**
```tsx
// admin-portal/lib/api/admin.ts
import { getServerSession } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.detail || `HTTP ${response.status}`,
      error
    );
  }

  return response.json();
}

export const adminApi = {
  // Games
  async getGames() {
    return fetchWithAuth('/admin/games');
  },

  async getGame(gameId: string) {
    return fetchWithAuth(`/admin/games/${gameId}`);
  },

  async createGame(data: { bgg_id: number; name_base: string; status: string }) {
    return fetchWithAuth('/admin/games', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGame(gameId: string, data: Partial<Game>) {
    return fetchWithAuth(`/admin/games/${gameId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async importFromBGG(bggId: number) {
    return fetchWithAuth('/admin/games/import-bgg', {
      method: 'POST',
      body: JSON.stringify({ bgg_id: bggId }),
    });
  },

  // Documents
  async uploadDocument(
    gameId: string,
    file: File,
    metadata: { language: string; source_type: string }
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', metadata.language);
    formData.append('source_type', metadata.source_type);

    const session = await getServerSession();
    
    const response = await fetch(`${API_URL}/admin/games/${gameId}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    return response.json();
  },

  async processKnowledge(gameId: string) {
    return fetchWithAuth(`/admin/games/${gameId}/process-knowledge`, {
      method: 'POST',
    });
  },

  // FAQs
  async createFAQ(
    gameId: string,
    data: { language: string; question: string; answer: string }
  ) {
    return fetchWithAuth(`/admin/games/${gameId}/faqs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFAQ(gameId: string, faqId: string, data: Partial<FAQ>) {
    return fetchWithAuth(`/admin/games/${gameId}/faqs/${faqId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteFAQ(gameId: string, faqId: string) {
    return fetchWithAuth(`/admin/games/${gameId}/faqs/${faqId}`, {
      method: 'DELETE',
    });
  },
};
```

### 6. Authentication

**NextAuth.js Setup**
```tsx
// admin-portal/lib/auth.ts
import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getServerSession() {
  return getNextAuthSession(authOptions);
}

export async function requireAuth(allowedRoles: string[] = ['admin', 'developer']) {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Insufficient permissions');
  }

  return session;
}
```

```tsx
// admin-portal/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Call Supabase Auth
        const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        
        // Fetch user profile
        const profileResponse = await fetch(`${process.env.API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          return null;
        }

        const profile = await profileResponse.json();

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          role: profile.role,
          accessToken: data.access_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 7. Layout & Navigation

**Root Layout**
```tsx
// admin-portal/app/layout.tsx
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BGAI Admin Portal',
  description: 'Board Game Assistant Intelligence - Administration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

## Best Practices

1. **Server Components by Default**: Use client components only when needed (interactivity, hooks, browser APIs)
2. **Data Fetching**: Fetch data in Server Components, stream with Suspense
3. **Type Safety**: Use TypeScript for all files, define proper interfaces
4. **Form Validation**: Use zod for schema validation, react-hook-form for complex forms
5. **Error Handling**: Implement error boundaries, show user-friendly messages
6. **Loading States**: Use Suspense boundaries, skeleton components
7. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
8. **Responsive Design**: Mobile-first approach with Tailwind breakpoints
9. **Performance**: Optimize images with next/image, lazy load components
10. **Security**: Validate auth on server actions, never expose secrets client-side

## References

- Next.js docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/
