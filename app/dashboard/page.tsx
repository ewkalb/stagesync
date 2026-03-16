// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/LogoutButton';

export const dynamic = 'force-dynamic'; // Skip prerender

type Video = {
  id: string;
  mux_playback_id: string | null;
  title: string;
  match: string;
  stage: string;
  beep_offset_seconds: number;
  // Add other fields
};

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const router = useRouter();

useEffect(() => {
  const supabase = createBrowserClient();
  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', session.user.id);
    if (error) {
      console.error(error);
      return;
    }
    setVideos(data || []);
  }
  fetchData();
}, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <LogoutButton />
      </div>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Your Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render videos list */}
        </CardContent>
      </Card>
      {/* Friends section, etc. */}
    </div>
  );
}