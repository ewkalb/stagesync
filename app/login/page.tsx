// app/login/page.tsx
'use client';
export const dynamic = 'force-dynamic'; // Skip prerender

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth'; // New server action
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (formData: FormData) => {
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/dashboard'); // Fallback, but server redirect handles it
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
        <CardHeader>
          <CardTitle>Log In to StageSync</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleLogin} className="space-y-4"> {/* Server action */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email" // For formData
                type="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password" // For formData
                type="password"
                required
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" className="w-full">Log In</Button>
          </form>
          <p className="mt-4 text-center text-zinc-400">
            No account? <a href="/signup" className="text-white hover:underline">Sign up</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}