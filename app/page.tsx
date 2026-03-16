// app/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-6xl font-bold tracking-tighter mb-6">StageSync</h1>
        <p className="text-2xl text-zinc-400 mb-8">
          Head-to-head synced POV hat-cam comparisons for competitive shooters
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="bg-white text-black px-8 py-4 rounded-xl font-semibold hover:bg-zinc-200 transition"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="border border-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-black transition"
          >
            Sign up free
          </a>
        </div>
        <p className="mt-12 text-zinc-500 text-sm">
          USPSA • IDPA • 3-Gun • Steel Challenge
        </p>
      </div>
    </div>
  );
}