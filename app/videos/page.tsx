// app/videos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MuxPlayer from '@mux/mux-player-react';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

type Video = {
  id: string;
  playback_id: string | null;
  match_name: string | null;
  range_location: string | null;
  match_date: string | null;
  stage_number: number | null;
  scoring_type: string | null;
  time: number | null;
  hit_factor: number | null;
  points_down: number | null;
  notes: string;
  trim_start: number;
  trim_end: number;
  visibility: 'private' | 'friends' | 'public';
};

export default function MyVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const supabase = createClient();

  const fetchVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setVideos(data || []);
  };

  useEffect(() => { fetchVideos(); }, []);

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video permanently?')) return;
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Video deleted');
      fetchVideos();
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>My Videos</CardTitle>
            <CardDescription>Manage your uploaded stages</CardDescription>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No videos yet — go upload some!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((v) => (
                  <Card key={v.id} className="overflow-hidden">
                    <div className="aspect-video bg-black relative">
                      {v.playback_id && (
                        <MuxPlayer
                          playbackId={v.playback_id}
                          startTime={v.trim_start || 0}
                          muted
                          style={{ width: '100%', height: '100%' }}
                        />
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <div className="font-medium">{v.match_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {v.range_location} • Stage {v.stage_number}
                        </div>
                      </div>

                      <Badge variant={v.visibility === 'public' ? "default" : "secondary"}>
                        {v.visibility === 'public' ? '🌍 Public' : v.visibility === 'friends' ? '👥 Friends' : '🔒 Private'}
                      </Badge>

                      <Button 
                        onClick={() => deleteVideo(v.id)} 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
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
    </>
  );
}