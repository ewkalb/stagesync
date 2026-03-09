// app/api/mux-asset/[id]/route.ts
import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;   // ← Next.js 16 required fix

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    console.log('📥 Fetching Mux asset status for:', id);

    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });

    const asset = await mux.video.assets.retrieve(id);

    console.log('✅ Mux asset retrieved:', {
      id: asset.id,
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id || null,
      duration: asset.duration,
    });

    return NextResponse.json({
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id || null,
      duration: asset.duration || null,
    });
  } catch (error: any) {
    console.error('❌ Mux asset retrieve failed:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}