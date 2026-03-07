// app/api/mux-asset/[id]/route.ts
import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const asset = await mux.video.assets.retrieve(id);

    console.log('Mux asset retrieved for', id, {
      status: asset.status,
      playbackIds: asset.playback_ids,
      duration: asset.duration,
    });

    return NextResponse.json({
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id || null,
      duration: asset.duration,
      errors: asset.errors,
    });
  } catch (error: any) {
    console.error('Mux asset fetch failed:', error.message || error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}