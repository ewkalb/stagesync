// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/LogoutButton';

type Video = {
  id: string;
  mux_playback_id: string;
  title: string;
  match: string;
  stage: string;
  beep_offset_seconds: number;
  // Other fields
};

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', session.user.id);

      setVideos(data || []);
    }
    fetchData();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render videos list, e.g., <ul>{videos.map(v => <li key={v.id}>{v.title}</li>)}</ul> */}
        </CardContent>
      </Card>
      {/* Add friends or other sections */}
    </div>
  );
}