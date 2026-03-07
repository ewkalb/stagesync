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
  const [assetId, setAssetId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const supabase = createClient();

  const createUpload = async () => {
    try {
      const res = await fetch('/api/mux-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || `HTTP ${res.status}`);
      }

      const { url } = await res.json();
      setUploadUrl(url);
      toast.info('Upload ready – drop your file now');
    } catch (err: any) {
      toast.error('Failed to prepare upload', {
        description: err.message || 'Unknown error',
      });
    }
  };

  const handleUploadSuccess = async (uploadData: any) => {
    console.log('MuxUploader onComplete received:', uploadData);

    const id = uploadData?.assetId || uploadData?.id || uploadData?.detail?.asset?.id;

    if (!id) {
      console.error('No asset ID found:', uploadData);
      toast.error('Upload succeeded but could not extract asset ID');
      return;
    }

    console.log('✅ Using asset ID:', id);
    setAssetId(id);

    toast.success('Upload complete! Processing...');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('videos').insert({
      user_id: user.id,
      mux_asset_id: id,
      notes: title || 'Untitled stage',
      classification: 'U',
    });
  };

  // Polling continues until we get a real playbackId
  useEffect(() => {
    if (!assetId) return;

    console.log('Polling effect triggered for assetId:', assetId);

    const interval = setInterval(async () => {
      console.log('Polling tick for:', assetId);

      const res = await fetch(`/api/mux-asset/${assetId}`);
      if (!res.ok) {
        console.error('Polling fetch failed:', res.status);
        return;
      }

      const data = await res.json();
      console.log('Polling response:', data);

      if (data.playbackId) {
        console.log('✅ Got playbackId:', data.playbackId);
        setPlaybackId(data.playbackId);
        clearInterval(interval);
        toast.success('Video ready to preview & trim!');
      } else if (data.status === 'errored') {
        toast.error('Processing failed');
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [assetId]);

  // Debug button - force polling with any Mux asset ID
  const forcePolling = () => {
    const testId = prompt('Enter a Mux asset ID to test (from Mux dashboard):');
    if (testId) {
      setAssetId(testId);
      toast.info('Forcing polling with test ID...');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Stage Video</CardTitle>
          <CardDescription>
            Drop your hat-cam footage here. We'll transcode it and let you trim & compare.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Stage Title / Notes (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stage 3 - Accelerator, Brazos Classic 2026"
            />
          </div>

          {!uploadUrl ? (
            <Button onClick={createUpload} className="w-full" size="lg">
              Prepare Upload
            </Button>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <MuxUploader
                endpoint={uploadUrl}
                onComplete={handleUploadSuccess}
                onProgress={(pct) => setProgress(pct)}
              />
              {progress > 0 && progress < 100 && (
                <div className="mt-4 text-center font-medium">
                  Uploading: {Math.round(progress)}%
                </div>
              )}
            </div>
          )}

          {assetId && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium">Preview (once ready)</h3>
              {playbackId ? (
                <div className="rounded-lg overflow-hidden border border-border">
                  <MuxPlayer
                    streamType="on-demand"
                    playbackId={playbackId}
                    metadata={{ video_title: title || 'Uploaded stage' }}
                    autoPlay
                    muted
                    style={{ aspectRatio: '16/9', width: '100%', height: 'auto' }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">
                    Processing video... (this may take 30–90 seconds)
                  </p>
                </div>
              )}
            </div>
          )}

          {playbackId && (
            <div className="mt-6">
              <Button className="w-full" size="lg">
                Set Trim Points & Save (next step)
              </Button>
            </div>
          )}

          {/* Debug button */}
          <Button variant="outline" onClick={forcePolling} className="w-full">
            Debug: Force Polling with Test ID
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}