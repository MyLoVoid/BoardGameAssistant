'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from '@/lib/supabase';
import { persistAuthCookies } from '@/lib/auth-cookies';
import { AlertCircle } from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { session } = await signIn(email, password);
      if (!session) {
        throw new Error('No session returned from Supabase');
      }
      persistAuthCookies(session);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <h1 className="text-4xl font-extrabold text-white">BGAI</h1>
            </div>
            <CardTitle className="text-3xl font-bold text-center">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-center text-white/80">
              Sign in to manage games and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/80 text-white px-4 py-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@bgai.test"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="bg-white/20 border-white/30 placeholder:text-white/60 focus:ring-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="bg-white/20 border-white/30 placeholder:text-white/60 focus:ring-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-white/90 text-blue-900 hover:bg-white"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-white/70">
              <p>For admin and developer access only</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
