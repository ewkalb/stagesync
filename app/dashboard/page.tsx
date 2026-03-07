// app/dashboard/page.tsx
import { createServerClientSsr } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/LogoutButton';  // ← New import

export default async function Dashboard() {
  const supabase = await createServerClientSsr();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, {user.email?.split('@')[0] || 'Shooter'}
        </h1>
        <LogoutButton /> 
      </div>

      <p className="text-lg text-muted-foreground mb-6">
        Your shooting videos await. Start by uploading a stage.
      </p>

      <Button asChild size="lg">
        <a href="/upload">Upload a Stage Video</a>
      </Button>
    </div>
  );
}