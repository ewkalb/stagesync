// app/dashboard/page.tsx
import { createServerClientSsr } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function Dashboard() {
  const supabase = await createServerClientSsr();  // <-- await!
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Welcome to StageSync, {user.email}</h1>
      <p className="mt-4">Your shooting videos await.</p>
      <Button asChild className="mt-6">
        <a href="/upload">Upload a Stage Video</a>
      </Button>
    </div>
  );
}