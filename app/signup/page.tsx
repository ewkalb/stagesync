// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isFormValid = email.trim() !== '' && password.trim().length >= 6;

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isFormValid) return;

  setLoading(true);

  try {
    // 1. Create the user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: email.split('@')[0].toLowerCase(),
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error('No user returned after signup');

    // 2. Immediately sign in (auto-login)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    // 3. Create the profile row (now authenticated)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: signUpData.user.id,
        username: email.split('@')[0].toLowerCase(),
        classification: 'U', // default: Unclassified – user can edit later
      });

    if (profileError) {
      console.error('Profile insert failed:', profileError);
      toast.error('Account created, but profile setup incomplete', {
        description: 'You can update your profile later in settings.',
      });
    } else {
      toast.success('Welcome to StageSync!', {
        description: 'Account and profile created successfully.',
      });
    }

    router.push('/dashboard');
  } catch (error: any) {
    toast.error('Signup failed', {
      description: error.message || 'Please try again.',
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create StageSync Account</CardTitle>
          <CardDescription>
            Sign up to start uploading and comparing your shooting stage videos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isFormValid}
              aria-disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Log in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}