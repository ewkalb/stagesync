// app/api/create-upload/route.ts
import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const mux = new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);

export async function GET() {
  try {
    const { data: upload } = await mux.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policies: 'public',
      },
    });

    return NextResponse.json({ url: upload.url });
  } catch (error) {
    console.error('Mux upload creation error:', error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}