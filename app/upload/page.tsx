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
  console.log('🚀 UPLOAD PAGE vFINAL — onSuccess + two-phase polling');

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
      toast.info('Drop your hat-cam video');
    } catch (err) {
      toast.error('Failed to prepare upload');
    }
  };

  const handleUploadSuccess = async (event: any) => {
    console.log('🔥 onSuccess FIRED — upload complete to Mux');
    if (!uploadId) {
      toast.error('Missing upload ID');
      return;
    }
    toast.success('Upload finished — waiting for Mux to create asset...');
  };

  // Phase 1: Poll for asset_id after upload success
  useEffect(() => {
    if (!uploadId || assetId) return;

    const interval = setInterval(async () => {
      console.log('Phase 1: Checking upload status for', uploadId);
      const res = await fetch(`/api/mux-upload-status/${uploadId}`);
      const data = await res.json();

      if (data.assetId) {
        console.log('✅ Got asset_id:', data.assetId);
        setAssetId(data.assetId);

        // Save to DB
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

  // Phase 2: Poll for playbackId (exactly like before)
  useEffect(() => {
    if (!assetId) return;

    console.log('Phase 2: Polling for playbackId on asset', assetId);

    const interval = setInterval(async () => {
      const res = await fetch(`/api/mux-asset/${assetId}`);
      const data = await res.json();

      if (data.playbackId) {
        console.log('🎉 Got playbackId:', data.playbackId);

        await supabase
          .from('videos')
          .update({
            playback_id: data.playbackId,
            duration: data.duration,
            status: 'ready',
          })
          .eq('mux_asset_id', assetId);

        setPlaybackId(data.playbackId);
        clearInterval(interval);
        toast.success('✅ Video ready — preview playing below!');
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [assetId]);

  const debugForce = () => {
    const id = prompt('Paste Mux asset ID for debug:');
    if (id) setAssetId(id);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Stage Video</CardTitle>
          <CardDescription>StageSync — USPSA Hat Cam Head-to-Head</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="title">Stage Notes (optional)</Label>
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
              <h3 className="font-semibold">Processing Status</h3>
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

          <Button variant="outline" onClick={debugForce} className="w-full">
            Debug: Force with asset ID
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}