// app/api/webhooks/mux.ts
import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import wavDecoder from 'wav-decoder';
import { EssentiaJS } from 'essentia.js';

const { Webhooks } = new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = Object.fromEntries(req.headers.entries());
  const signatureHeader = headersList['mux-signature'];

  try {
    Webhooks.verifyHeader(body, signatureHeader, process.env.MUX_WEBHOOK_SECRET);

    const jsonBody = JSON.parse(body);
    if (jsonBody.type !== 'video.asset.ready') return NextResponse.json({ ok: true });

    const assetId = jsonBody.data.id;
    const playbackId = jsonBody.data.playback_ids[0].id;

    const mp4Url = `https://stream.mux.com/${playbackId}/medium.mp4?token=your-signed-token`; // Sign properly

    const tmpDir = '/tmp';
    const mp4Path = path.join(tmpDir, `${assetId}.mp4`);
    const wavPath = path.join(tmpDir, `${assetId}.wav`);
    const { data: mp4Stream } = await axios.get(mp4Url, { responseType: 'stream' });
    const writer = fs.createWriteStream(mp4Path);
    mp4Stream.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await new Promise((resolve, reject) => {
      ffmpeg(mp4Path)
        .audioChannels(1)
        .audioFrequency(44100)
        .format('wav')
        .output(wavPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const wavBuffer = fs.readFileSync(wavPath);
    const decoded = await wavDecoder.decode(wavBuffer);
    const audioSignal = decoded.channelData[0];

    const essentia = new EssentiaJS();
    const frameSize = 1024;
    const hopSize = 512;
    const onsets = essentia.Onsets({
      frameSize,
      hopSize,
      sampleRate: 44100,
    }, audioSignal);

    const beepOffset = onsets.onsetTimestamps[0] || 0;

    fs.unlinkSync(mp4Path);
    fs.unlinkSync(wavPath);

    const supabase = await createClient();
    await supabase
      .from('videos')
      .update({ beep_offset_seconds: beepOffset })
      .eq('mux_asset_id', assetId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}