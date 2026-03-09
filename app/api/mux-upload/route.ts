// app/api/mux-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('Creating Mux upload...');
    console.log('Token ID set:', !!process.env.MUX_TOKEN_ID);
    console.log('Token Secret set:', !!process.env.MUX_TOKEN_SECRET);

    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      new_asset_settings: {
        playback_policies: ['public'],   // ← THIS IS THE FIX (plural + array + nested)
        // Optional but nice for hat-cam footage:
        // mp4_support: 'standard',      // for direct MP4 downloads later
      },
    });

    console.log('Upload created successfully:', upload.id);
    return NextResponse.json({ url: upload.url });
  } catch (error: any) {
    console.error('Mux upload creation failed:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to create upload', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}