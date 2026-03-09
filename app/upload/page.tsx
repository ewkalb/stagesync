// app/upload/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import MuxUploader from '@mux/mux-uploader-react';
import MuxPlayer from '@mux/mux-player-react';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const supabase = createClient();

  const createUpload = async () => {
    try {
      const res = await fetch('/api/mux-upload', { method: 'POST' });
      const { url, uploadId: id } = await res.json();
      setUploadUrl(url);
      setUploadId(id);
      toast.info('Drop your hat-cam video below');
    } catch {
      toast.error('Failed to prepare upload');
    }
  };

  const handleUploadSuccess = async () => {
    if (!uploadId) return;
    toast.success('Upload finished — Mux processing...');
  };

  // Phase 1: asset_id
  useEffect(() => {
    if (!uploadId || assetId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/mux-upload-status/${uploadId}`);
      const data = await res.json();
      if (data.assetId) {
        setAssetId(data.assetId);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('videos').insert({
            user_id: user.id,
            mux_asset_id: data.assetId,
            mux_upload_id: uploadId,
            notes: title || 'Untitled stage',
            classification: 'U',
          });
        }
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [uploadId, assetId]);

  // Phase 2: playbackId + duration
  useEffect(() => {
    if (!assetId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/mux-asset/${assetId}`);
      const data = await res.json();
      if (data.playbackId) {
        setPlaybackId(data.playbackId);
        setDuration(data.duration || 0);
        setTrimEnd(data.duration || 0);
        await supabase
          .from('videos')
          .update({ playback_id: data.playbackId, duration: data.duration, status: 'ready' })
          .eq('mux_asset_id', assetId);
        clearInterval(interval);
        toast.success('✅ Video ready — trim with the clamps below!');
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [assetId]);

  const saveTrim = async () => {
    if (!assetId) return;
    const { error } = await supabase
      .from('videos')
      .update({ trim_start: trimStart, trim_end: trimEnd })
      .eq('mux_asset_id', assetId);
    error ? toast.error('Failed to save trim') : toast.success('Trim saved! Ready for head-to-head compare.');
  };

  const trimmedLength = Math.max(0, trimEnd - trimStart);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Stage Video</CardTitle>
          <CardDescription>USPSA StageSync — Hat-cam POV for head-to-head comparison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="title">Stage / Match Notes (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stage 3 - Brazos Classic 2026"
            />
          </div>

          {!uploadUrl ? (
            <Button onClick={createUpload} className="w-full" size="lg">
              Prepare Upload
            </Button>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-8">
              <MuxUploader endpoint={uploadUrl} onSuccess={handleUploadSuccess} />
            </div>
          )}

          {assetId && (
            <div className="mt-8 space-y-6">
              <h3 className="font-semibold">Live Preview + Trim (drag the clamps)</h3>

              {playbackId ? (
                <div className="rounded-xl overflow-hidden border shadow-sm">
                  <MuxPlayer
                    playbackId={playbackId}
                    streamType="on-demand"
                    startTime={trimStart}
                    autoPlay
                    muted
                    style={{ aspectRatio: '16/9', width: '100%' }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <p>Mux is processing... (30–90 seconds)</p>
                </div>
              )}

              {duration > 0 && (
                <div className="space-y-4 bg-muted/50 p-6 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span>Trim start</span>
                    <span>{trimStart.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Trim end</span>
                    <span>{trimEnd.toFixed(1)}s</span>
                  </div>

                  <Slider
                    value={[trimStart, trimEnd]}
                    max={duration}
                    step={0.1}
                    onValueChange={([start, end]) => {
                      setTrimStart(start);
                      setTrimEnd(end);
                    }}
                    className="my-2"
                  />

                  <div className="flex justify-between text-sm font-medium">
                    <span>Trimmed length</span>
                    <span className="text-primary">{trimmedLength.toFixed(1)}s</span>
                  </div>

                  <Button onClick={saveTrim} className="w-full" size="lg">
                    Save Trim Points
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}