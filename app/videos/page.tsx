// app/videos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MuxPlayer from '@mux/mux-player-react';
import { toast } from 'sonner';

type Video = {
  id: string;
  user_id: string;
  match_id: string | null;
  stage_id: string | null;
  mux_asset_id: string;
  mux_playback_id: string | null;
  trim_start_sec: number | null;
  trim_end_sec: number | null;
  classification: string | null;
  notes: string;
  uploaded_at: string;
  updated_at: string;
  mux_upload_id: string;
  playback_id: string | null;
  duration: string | null;
  status: string;
  trim_start: string | null;
  trim_end: string | null;
  created_at: string;
  match_name: string | null;
  stage_name: string | null;
  range_location: string;
  match_date: string;
  stage_number: number;
  scoring_type: string;
  time: number | null;
  hit_factor: number | null;
  points_down: number | null;
  is_public: boolean;
  visibility: 'public' | 'friends' | 'private';
  beep_offset_seconds: number;
};

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchVideos() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase.from('videos').select('*');
      if (error) {
        toast.error('Failed to load videos: ' + error.message);
        console.error('Videos fetch error:', error);
        return;
      }
      setVideos(data || []);
    }
    fetchVideos();
  }, [router]);

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video permanently?')) return;
    const supabase = createBrowserClient();
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) toast.error('Failed to delete: ' + error.message);
    else {
      toast.success('Video deleted');
      const { data } = await supabase.from('videos').select('*');
      setVideos(data || []);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">My Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-center text-zinc-400 py-12">No videos yet — go upload some!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v) => (
                <Card key={v.id} className="overflow-hidden bg-zinc-900 border-zinc-800">
                  <div className="aspect-video bg-black relative">
                    {v.playback_id && (
                      <MuxPlayer
                        playbackId={v.playback_id}
                        startTime={v.trim_start || 0}
                        muted
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="font-medium text-white">{v.notes}</div>
                      <div className="text-xs text-zinc-400">
                        {v.range_location} • Stage {v.stage_number}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {v.visibility}
                    </Badge>
                    <Button 
                      onClick={() => deleteVideo(v.id)} 
                      variant="destructive" 
                      size="sm" 
                      className="w-full bg-red-900 hover:bg-red-800"
                    >
                      Delete Video
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}