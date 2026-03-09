// app/compare/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import MuxPlayer from '@mux/mux-player-react';
import Navbar from '@/components/Navbar';

type Video = {
  id: string;
  mux_asset_id: string;
  playback_id: string | null;
  notes: string;
  trim_start: number;
  trim_end: number;
  duration: number;
  status: string | null;
  match_name: string | null;
  range_location: string | null;
  match_date: string | null;
  stage_number: number | null;
  scoring_type: string | null;
  time: number | null;
  hit_factor: number | null;
  points_down: number | null;
  visibility: 'private' | 'friends' | 'public';
  user_id: string;
};

export default function ComparePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoA, setVideoA] = useState<Video | null>(null);
  const [videoB, setVideoB] = useState<Video | null>(null);
  const [offset, setOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');

  const playerARef = useRef<any>(null);
  const playerBRef = useRef<any>(null);
  const supabase = createClient();

  const fetchVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('videos')
      .select('*');

    console.log('RAW videos from DB:', data?.length || 0, data);

    const visible = (data || []).filter(v => 
      v.user_id === user.id || v.visibility === 'public'
    );

    console.log('🔍 Visible videos for compare:', visible.length, visible.map(v => ({
      id: v.id.slice(0,8),
      match: v.match_name,
      visibility: v.visibility,
      owner: v.user_id === user.id ? 'MINE' : 'OTHER'
    })));

    setVideos(visible);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(v =>
    (!selectedMatch || v.match_name === selectedMatch) &&
    (!selectedStage || v.stage_number?.toString() === selectedStage)
  );

  const selectedA = videoA || filteredVideos[0];
  const selectedB = videoB || filteredVideos[1];

  const effectiveStartA = selectedA?.trim_start || 0;
  const effectiveStartB = (selectedB?.trim_start || 0) + offset;

  const formatScoring = (v: Video | undefined) => {
    if (!v?.time) return '';
    if (v.scoring_type === 'USPSA' && v.hit_factor) return `${v.time}s • HF ${v.hit_factor}`;
    if (v.scoring_type === 'IDPA' && v.points_down !== null) return `${v.time}s • PD ${v.points_down}`;
    return `${v.time}s`;
  };

  const offsetLabel = offset === 0 ? 'Perfectly synced' : offset > 0 ? `→ Right delayed ${offset.toFixed(1)}s` : `← Right advanced ${Math.abs(offset).toFixed(1)}s`;

  const togglePlayBoth = async () => {
    const a = playerARef.current;
    const b = playerBRef.current;
    if (!a || !b) return;
    if (isPlaying) {
      a.pause(); b.pause(); setIsPlaying(false);
    } else {
      a.currentTime = effectiveStartA;
      b.currentTime = effectiveStartB;
      await a.play();
      await b.play();
      setIsPlaying(true);
    }
  };

  const swapVideos = () => {
    const temp = videoA;
    setVideoA(videoB);
    setVideoB(temp);
    setOffset(-offset);
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Head-to-Head Stage Compare</CardTitle>
            <CardDescription>Sync hat-cam POVs — align the beep or any stage moment</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Match</Label>
                <Select onValueChange={setSelectedMatch}>
                  <SelectTrigger><SelectValue placeholder="All matches" /></SelectTrigger>
                  <SelectContent>
                    {[...new Set(videos.map(v => v.match_name).filter(Boolean))].map(m => (
                      <SelectItem key={m} value={m!}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stage</Label>
                <Select onValueChange={setSelectedStage}>
                  <SelectTrigger><SelectValue placeholder="All stages" /></SelectTrigger>
                  <SelectContent>
                    {[...new Set(videos.map(v => v.stage_number?.toString()).filter(Boolean))].map(s => (
                      <SelectItem key={s} value={s!}>Stage {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { setSelectedMatch(''); setSelectedStage(''); }} variant="outline" className="mt-8 md:mt-auto">
                Clear Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Left Player (A)</Label>
                <Select onValueChange={(id) => setVideoA(filteredVideos.find(v => v.id === id) || null)}>
                  <SelectTrigger><SelectValue placeholder="Choose video..." /></SelectTrigger>
                  <SelectContent>
                    {filteredVideos.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.notes || `Video ${v.id.slice(0,8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Right Player (B)</Label>
                <Select onValueChange={(id) => setVideoB(filteredVideos.find(v => v.id === id) || null)}>
                  <SelectTrigger><SelectValue placeholder="Choose video..." /></SelectTrigger>
                  <SelectContent>
                    {filteredVideos.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.notes || `Video ${v.id.slice(0,8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedA?.playback_id && selectedB?.playback_id && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-center lg:text-left">LEFT — {selectedA.notes}</div>
                      <div className="text-xs text-muted-foreground text-center lg:text-left">
                        {selectedA.stage_number && `Stage ${selectedA.stage_number} • `}
                        {selectedA.range_location} 
                        {selectedA.match_date && ` • ${new Date(selectedA.match_date).toLocaleDateString()}`}
                        {formatScoring(selectedA) && ` • ${formatScoring(selectedA)}`}
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden border shadow-sm">
                      <MuxPlayer ref={playerARef} playbackId={selectedA.playback_id} streamType="on-demand" startTime={effectiveStartA} style={{ aspectRatio: '16/9', width: '100%' }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-center lg:text-left">RIGHT — {selectedB.notes}</div>
                      <div className="text-xs text-muted-foreground text-center lg:text-left">
                        {selectedB.stage_number && `Stage ${selectedB.stage_number} • `}
                        {selectedB.range_location} 
                        {selectedB.match_date && ` • ${new Date(selectedB.match_date).toLocaleDateString()}`}
                        {formatScoring(selectedB) && ` • ${formatScoring(selectedB)}`}
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden border shadow-sm">
                      <MuxPlayer ref={playerBRef} playbackId={selectedB.playback_id} streamType="on-demand" startTime={effectiveStartB} style={{ aspectRatio: '16/9', width: '100%' }} />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-6 md:p-8 rounded-2xl flex flex-col items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-1">Sync Offset</div>
                    <div className="text-xl md:text-2xl font-mono text-primary">{offsetLabel}</div>
                  </div>

                  <Slider value={[offset]} min={-30} max={30} step={0.1} onValueChange={([val]) => setOffset(val)} className="w-full max-w-md" />

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <Button onClick={togglePlayBoth} size="lg" className="flex-1 text-lg">
                      {isPlaying ? '⏸️ Pause Both' : '▶️ Play Both'}
                    </Button>
                    <Button onClick={swapVideos} variant="outline" size="lg" className="flex-1">
                      ↔️ Swap A ↔ B
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}