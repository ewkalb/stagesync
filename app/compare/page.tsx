// app/compare/page.tsx
'use client';
export const dynamic = 'force-dynamic'; // Skip prerender

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Video = {
  id: string;
  mux_playback_id: string;
  match_name: string;
  stage_name: string;
  beep_offset_seconds: number;
  range_location: string | null;
  match_date: string;
  stage_number: number;
  scoring_type: string;
  time: number | null;
  hit_factor: number | null;
  points_down: number | null;
  trim_start: number;
  trim_end: number;
  visibility: 'private' | 'friends' | 'public';
  user_id: string;
  notes: string; // For title
};

export default function Compare() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoA, setSelectedVideoA] = useState<string | null>(null);
  const [selectedVideoB, setSelectedVideoB] = useState<string | null>(null);
  const [syncOffset, setSyncOffset] = useState(0);
  const [matchFilter, setMatchFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const playerARef = useRef<MuxPlayer>(null);
  const playerBRef = useRef<MuxPlayer>(null);
  const router = useRouter();

useEffect(() => {
  const supabase = createBrowserClient();
  async function fetchVideos() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { data: fromFriends, error: fromError } = await supabase
      .from('friend_requests')
      .select('requestee_id')
      .eq('requester_id', session.user.id)
      .eq('status', 'accepted');
    const { data: toFriends, error: toError } = await supabase
      .from('friend_requests')
      .select('requester_id')
      .eq('requestee_id', session.user.id)
      .eq('status', 'accepted');
    if (fromError || toError) {
      toast.error('Failed to load friends: ' + (fromError || toError)?.message);
      console.error('Friends fetch error:', fromError || toError);
      return;
    }
    const friendIds = new Set([
      ...(fromFriends?.map(f => f.requestee_id) || []),
      ...(toFriends?.map(f => f.requester_id) || []),
    ]);
    const { data: allVideos, error: videosError } = await supabase.from('videos').select('*');
    if (videosError) {
      toast.error('Failed to load videos: ' + videosError.message);
      console.error('Videos fetch error:', videosError);
      return;
    }
    const visible = (allVideos || []).filter(v => {
      const isMine = v.user_id === session.user.id;
      const isPublic = v.visibility === 'public';
      const isFriendVideo = v.visibility === 'friends' && friendIds.has(v.user_id);
      return isMine || isPublic || isFriendVideo;
    });
    setVideos(visible);
  }
  fetchVideos();
}, [router]);

  useEffect(() => {
    if (selectedVideoA && selectedVideoB) {
      const videoA = videos.find(v => v.id === selectedVideoA);
      const videoB = videos.find(v => v.id === selectedVideoB);
      if (videoA && videoB) {
        const autoOffset = videoA.beep_offset_seconds - videoB.beep_offset_seconds;
        setSyncOffset(autoOffset);
        applySync(autoOffset);
      }
    }
  }, [selectedVideoA, selectedVideoB, videos]);

  const applySync = (offset: number) => {
    if (playerARef.current && playerBRef.current) {
      playerARef.current.pause();
      playerBRef.current.pause();
      playerARef.current.currentTime = Math.max(0, offset);
      playerBRef.current.currentTime = Math.max(0, -offset);
    }
  };

  const playBoth = () => {
    if (playerARef.current && playerBRef.current) {
      playerARef.current.play();
      playerBRef.current.play();
    }
  };

  const swapVideos = () => {
    const temp = selectedVideoA;
    setSelectedVideoA(selectedVideoB);
    setSelectedVideoB(temp);
    setSyncOffset(-syncOffset);
  };

  const uniqueMatches = [...new Set(videos.map(v => v.match_name))];
  const uniqueStages = [...new Set(videos.map(v => v.stage_name))];

  const filteredVideos = videos.filter(v => 
    (!matchFilter || v.match_name === matchFilter) &&
    (!stageFilter || v.stage_name === stageFilter)
  );

  const formatScoring = (v: Video | null) => {
    if (!v?.time) return '';
    if (v.scoring_type === 'USPSA' && v.hit_factor) return `${v.time}s • HF ${v.hit_factor}`;
    if (v.scoring_type === 'IDPA' && v.points_down !== null) return `${v.time}s • PD ${v.points_down}`;
    return `${v.time}s`;
  };

  const selectedA = videos.find(v => v.id === selectedVideoA) || filteredVideos[0];
  const selectedB = videos.find(v => v.id === selectedVideoB) || filteredVideos[1];

  const offsetLabel = syncOffset === 0 ? 'Perfectly synced' : syncOffset > 0 ? `Right delayed ${syncOffset.toFixed(1)}s` : `Right advanced ${Math.abs(syncOffset).toFixed(1)}s`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Compare Videos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Select onValueChange={setMatchFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Match" /></SelectTrigger>
              <SelectContent>
                {uniqueMatches.map((m, idx) => <SelectItem key={idx} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={setStageFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Stage" /></SelectTrigger>
              <SelectContent>
                {uniqueStages.map((s, idx) => <SelectItem key={idx} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select value={selectedVideoA || ''} onValueChange={setSelectedVideoA}>
              <SelectTrigger><SelectValue placeholder="Select Video A" /></SelectTrigger>
              <SelectContent>
                {filteredVideos.map(v => <SelectItem key={v.id} value={v.id}>{v.notes}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedVideoB || ''} onValueChange={setSelectedVideoB}>
              <SelectTrigger><SelectValue placeholder="Select Video B" /></SelectTrigger>
              <SelectContent>
                {filteredVideos.map(v => <SelectItem key={v.id} value={v.id}>{v.notes}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedA && selectedB && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-zinc-300">A: {formatScoring(selectedA)}</p>
                <MuxPlayer
                  ref={playerARef}
                  playbackId={selectedA.playback_id}
                  metadata={{ video_title: 'Video A' }}
                  className="w-full aspect-video"
                />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-300">B: {formatScoring(selectedB)}</p>
                <MuxPlayer
                  ref={playerBRef}
                  playbackId={selectedB.playback_id}
                  metadata={{ video_title: 'Video B' }}
                  className="w-full aspect-video"
                />
              </div>
            </div>
          )}
          <div className="space-y-4">
            <p className="text-zinc-300">{offsetLabel}</p>
            <div className="flex items-center gap-4">
              <span className="text-white">Sync Offset (seconds):</span>
              <Slider
                value={[syncOffset]}
                onValueChange={([val]) => {
                  setSyncOffset(val);
                  applySync(val);
                }}
                min={-30}
                max={30}
                step={0.1}
                className="flex-1"
              />
              <span className="text-white">{syncOffset.toFixed(1)}s</span>
            </div>
            <div className="flex gap-4">
              <Button onClick={playBoth} className="bg-white text-black hover:bg-zinc-200">Play Both</Button>
              <Button onClick={swapVideos} className="border-white hover:bg-white hover:text-black">Swap Videos</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}