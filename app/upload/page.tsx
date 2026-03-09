// app/upload/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import MuxUploader from '@mux/mux-uploader-react';
import MuxPlayer from '@mux/mux-player-react';
import Navbar from '@/components/Navbar';

const RANGES = ['Mission 160', 'Frisco Gun Club', 'Mister Guns', 'Lake Forest', '38 America'];

export default function UploadPage() {
  const [rangeLocation, setRangeLocation] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [stageNumber, setStageNumber] = useState('');
  const [scoringType, setScoringType] = useState<'USPSA' | 'IDPA' | ''>('');
  const [time, setTime] = useState('');
  const [hitFactor, setHitFactor] = useState('');
  const [pointsDown, setPointsDown] = useState('');
  const [videoName, setVideoName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'friends' | 'public'>('private');

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
      toast.info('Drop your hat-cam video');
    } catch {
      toast.error('Failed to prepare upload');
    }
  };

  const handleUploadSuccess = async () => {
    if (!uploadId) return;
    toast.success('Upload finished — processing...');
  };

  // Phase 1: Get asset_id after upload
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
            notes: videoName || 'Untitled stage',
          });
        }
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadId, assetId]);

  // Phase 2: Get playbackId + duration
  useEffect(() => {
    if (!assetId) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/mux-asset/${assetId}`);
      const data = await res.json();
      if (data.playbackId) {
        setPlaybackId(data.playbackId);
        setDuration(data.duration || 0);
        setTrimEnd(data.duration || 0);
        await supabase.from('videos').update({
          playback_id: data.playbackId,
          duration: data.duration,
          status: 'ready',
        }).eq('mux_asset_id', assetId);
        clearInterval(interval);
        toast.success('✅ Video ready — add details & trim!');
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [assetId]);

  const saveTrim = async () => {
    if (!assetId) return;
    const autoMatchName = rangeLocation && matchDate ? `${rangeLocation} - ${matchDate}` : 'Untitled Match';

    const { error } = await supabase
      .from('videos')
      .update({
        trim_start: trimStart,
        trim_end: trimEnd,
        match_name: autoMatchName,
        range_location: rangeLocation || null,
        match_date: matchDate || null,
        stage_number: stageNumber ? parseInt(stageNumber) : null,
        scoring_type: scoringType || null,
        time: time ? parseFloat(time) : null,
        hit_factor: scoringType === 'USPSA' && hitFactor ? parseFloat(hitFactor) : null,
        points_down: scoringType === 'IDPA' && pointsDown ? parseInt(pointsDown) : null,
        notes: videoName || 'Untitled stage',
        visibility,
      })
      .eq('mux_asset_id', assetId);

    error ? toast.error('Failed to save') : toast.success('Everything saved!');
  };

  const uploadAnother = () => {
    // Keep persistent fields for the next video in the same match
    setUploadUrl(null);
    setUploadId(null);
    setAssetId(null);
    setPlaybackId(null);
    setTrimStart(0);
    setTrimEnd(0);
    setStageNumber('');
    setTime('');
    setHitFactor('');
    setPointsDown('');
    // Do NOT reset rangeLocation, matchDate, scoringType, or visibility
  };

  const trimmedLength = Math.max(0, trimEnd - trimStart);

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload Stage Video</CardTitle>
            <CardDescription>USPSA StageSync — Hat-cam POV for head-to-head comparison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Match Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Range Location</Label>
                <Select value={rangeLocation} onValueChange={setRangeLocation}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>{RANGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Match Date</Label>
                <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scoring Type</Label>
                <Select value={scoringType} onValueChange={(v) => setScoringType(v as 'USPSA' | 'IDPA')}>
                  <SelectTrigger><SelectValue placeholder="USPSA or IDPA" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USPSA">USPSA</SelectItem>
                    <SelectItem value="IDPA">IDPA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage Number</Label>
                <Input type="number" value={stageNumber} onChange={(e) => setStageNumber(e.target.value)} placeholder="3" />
              </div>
            </div>

            {scoringType && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/50 p-6 rounded-xl">
                <div className="space-y-2">
                  <Label>Time (seconds)</Label>
                  <Input type="number" step="0.01" value={time} onChange={(e) => setTime(e.target.value)} placeholder="12.34" />
                </div>
                {scoringType === 'USPSA' && (
                  <div className="space-y-2">
                    <Label>Hit Factor</Label>
                    <Input type="number" step="0.01" value={hitFactor} onChange={(e) => setHitFactor(e.target.value)} placeholder="4.85" />
                  </div>
                )}
                {scoringType === 'IDPA' && (
                  <div className="space-y-2">
                    <Label>Points Down</Label>
                    <Input type="number" value={pointsDown} onChange={(e) => setPointsDown(e.target.value)} placeholder="5" />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Video Name (shows in Compare dropdown)</Label>
              <Input value={videoName} onChange={(e) => setVideoName(e.target.value)} placeholder="My run - felt fast on the draw" />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as 'private' | 'friends' | 'public')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (only me)</SelectItem>
                  <SelectItem value="friends">Friends only</SelectItem>
                  <SelectItem value="public">Public (anyone)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!uploadUrl ? (
              <Button onClick={createUpload} className="w-full" size="lg">Prepare Upload</Button>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-8">
                <MuxUploader endpoint={uploadUrl} onSuccess={handleUploadSuccess} />
              </div>
            )}

            {assetId && (
              <div className="space-y-6">
                {playbackId ? (
                  <div className="rounded-xl overflow-hidden border shadow-sm">
                    <MuxPlayer playbackId={playbackId} streamType="on-demand" startTime={trimStart} style={{ aspectRatio: '16/9', width: '100%' }} />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-xl flex items-center justify-center"><p>Mux is processing... (30–90 seconds)</p></div>
                )}

                {duration > 0 && (
                  <div className="space-y-4 bg-muted/50 p-6 rounded-xl">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Start time</span><span>{trimStart.toFixed(1)}s</span></div>
                      <Slider value={[trimStart]} max={duration} step={0.1} onValueChange={([v]) => setTrimStart(v)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>End time</span><span>{trimEnd.toFixed(1)}s</span></div>
                      <Slider value={[trimEnd]} min={trimStart} max={duration} step={0.1} onValueChange={([v]) => setTrimEnd(v)} />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={saveTrim} className="flex-1" size="lg">Save Everything</Button>
                      <Button onClick={uploadAnother} variant="outline" className="flex-1" size="lg">Upload Another Video</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}