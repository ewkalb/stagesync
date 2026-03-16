// app/upload/page.tsx
'use client';
export const dynamic = 'force-dynamic'; // Skip prerender

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import MuxUploader from '@mux/mux-uploader-react';
import MuxPlayer from '@mux/mux-player-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Upload() {
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [match, setMatch] = useState('');
  const [range, setRange] = useState('');
  const [date, setDate] = useState('');
  const [stage, setStage] = useState('');
  const [scoring, setScoring] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('private');

  const router = useRouter();

useEffect(() => {
  const supabase = createBrowserClient();
  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/login');
  }
  checkSession();
  async function fetchUploadUrl() {
    const res = await fetch('/api/mux-upload', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      toast.error('Failed to get upload URL: ' + (err.error || 'Unknown'));
      return;
    }
    const { url } = await res.json();
    setUploadUrl(url);
  }
  fetchUploadUrl();
}, [router]);

  const handleUploadSuccess = (evt: CustomEvent) => {
    const detail = evt.detail;
    if (!detail) {
      console.error('Upload success event has no detail');
      toast.error('Upload completed but no asset details received');
      return;
    }
    console.log('Upload success detail:', detail); // Debug
    setAssetId(detail.asset_id);
    setPlaybackId(detail.playback_ids?.[0]?.id || null);
  };

  const handleDuration = (evt: CustomEvent) => {
    setDuration(evt.detail.duration);
    setTrimEnd(evt.detail.duration || 0); // Default trim to full
  };

  const saveVideo = async () => {
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !assetId || !playbackId) {
      toast.error('Missing user or asset details - upload may not be complete');
      return;
    }

    console.log('Saving video with:', { assetId, playbackId, trimStart, trimEnd }); // Debug

    const { error } = await supabase.from('videos').insert({
      user_id: user.id,
      mux_asset_id: assetId,
      playback_id: playbackId,
      trim_start: trimStart,
      trim_end: trimEnd,
      match_name: match,
      range_location: range,
      match_date: date,
      stage_number: stage ? Number(stage) : null,
      scoring_type: scoring,
      notes,
      visibility,
      // Add status: 'ready' or other fields if needed
    });

    if (error) {
      toast.error('Failed to save video: ' + error.message);
      console.error('Insert error:', error);
    } else {
      toast.success('Video saved successfully!');
      router.push('/videos');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Upload Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {uploadUrl ? (
            <MuxUploader
              endpoint={uploadUrl}
              onSuccess={handleUploadSuccess}
              onDuration={handleDuration}
              onUploadStart={(evt) => console.log('Upload started:', evt.detail.id)}
              className="w-full"
            />
          ) : (
            <p className="text-zinc-400 text-center">Loading upload endpoint...</p>
          )}

          {playbackId && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <MuxPlayer
                  playbackId={playbackId}
                  startTime={trimStart}
                  endTime={trimEnd}
                  muted
                  className="w-full h-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Trim Start: {trimStart.toFixed(1)}s</Label>
                <Slider
                  value={[trimStart]}
                  onValueChange={([val]) => setTrimStart(val)}
                  min={0}
                  max={duration || 60}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Trim End: {trimEnd.toFixed(1)}s</Label>
                <Slider
                  value={[trimEnd]}
                  onValueChange={([val]) => setTrimEnd(val)}
                  min={trimStart}
                  max={duration || 60}
                  step={0.1}
                />
              </div>
            </div>
          )}

          <Input 
            placeholder="Match Name" 
            value={match} 
            onChange={(e) => setMatch(e.target.value)} 
            className="bg-zinc-800 text-white border-zinc-700" 
          />
          <Input 
            placeholder="Range Location" 
            value={range} 
            onChange={(e) => setRange(e.target.value)} 
            className="bg-zinc-800 text-white border-zinc-700" 
          />
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="bg-zinc-800 text-white border-zinc-700" 
          />
          <Input 
            placeholder="Stage Number" 
            value={stage} 
            onChange={(e) => setStage(e.target.value)} 
            className="bg-zinc-800 text-white border-zinc-700" 
          />
          <Input 
            placeholder="Scoring Type (USPSA/IDPA)" 
            value={scoring} 
            onChange={(e) => setScoring(e.target.value)} 
            className="bg-zinc-800 text-white border-zinc-700" 
          />
          <Input 
            placeholder="Notes" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="bg-zinc-800 text-white border-zinc-700" 
          />
          <Select value={visibility} onValueChange={(v: 'public' | 'friends' | 'private') => setVisibility(v)}>
            <SelectTrigger className="bg-zinc-800 text-white border-zinc-700">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={saveVideo} 
            disabled={!playbackId} 
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            Save Video
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}