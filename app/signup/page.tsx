// app/upload/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MuxUploader from '@mux/mux-uploader-react';
import MuxPlayer from '@mux/mux-player-react';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  const supabase = createClient();

  const createUpload = async () => {
    try {
      const res = await fetch('/api/mux-upload', { method: 'POST' });
      const { url, uploadId: id } = await res.json();
      setUploadUrl(url);
      setUploadId(id);
      toast.info('Drop your hat-cam video below');
    } catch (err) {
      toast.error('Failed to prepare upload');
    }
  };

  const handleUploadSuccess = async () => {
    if (!uploadId) return;
    toast.success('Upload finished — Mux is creating asset...');
  };

  // Phase 1: Poll for asset_id
  useEffect(() => {
    if (!uploadId || assetId) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/mux-upload-status/${uploadId}`);
      const data = await res.json();

      if (data.assetId) {
        setAssetId(data.assetId);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('videos').insert({
            user_id: user.id,
            mux_asset_id: data.assetId,
            mux_upload_id: uploadId,
            notes: title || 'Untitled stage',
            classification: 'U',
          });
          if (error) console.warn('DB insert warning:', error.message);
        }
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadId, assetId]);

  // Phase 2: Poll for playbackId + save metadata
  useEffect(() => {
    if (!assetId) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/mux-asset/${assetId}`);
      const data = await res.json();

      if (data.playbackId) {
        const { error } = await supabase
          .from('videos')
          .update({
            playback_id: data.playbackId,
            duration: data.duration,
            status: 'ready',
          })
          .eq('mux_asset_id', assetId);

        if (error) console.warn('DB update warning:', error.message);

        setPlaybackId(data.playbackId);
        clearInterval(interval);
        toast.success('✅ Video ready for preview & trimming!');
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [assetId]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Stage Video</CardTitle>
          <CardDescription>
            USPSA StageSync — Hat-cam POV for head-to-head comparison
          </CardDescription>
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
            <div className="mt-8 space-y-3">
              <h3 className="font-semibold">Live Preview</h3>
              {playbackId ? (
                <div className="rounded-xl overflow-hidden border shadow-sm">
                  <MuxPlayer
                    playbackId={playbackId}
                    streamType="on-demand"
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
            </div>
          )}

          {playbackId && (
            <Button className="w-full" size="lg">
              Set Trim Points &amp; Save (next step)
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}