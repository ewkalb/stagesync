// app/api/mux-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    console.log('🎥 [Mux] Preparing direct upload...');

    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });

    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      new_asset_settings: {
        playback_policies: ['public'],
      },
    });

    console.log('✅ [Mux] Upload created:', upload.id);
    return NextResponse.json({ 
      url: upload.url, 
      uploadId: upload.id 
    });
  } catch (error: any) {
    console.error('❌ [Mux Upload] Failed:', error.message || error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}