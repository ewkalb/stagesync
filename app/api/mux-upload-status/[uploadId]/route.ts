// app/api/mux-upload-status/[uploadId]/route.ts
import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;   // ← THIS IS THE FIX (Next.js 16 requirement)

    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId is required' }, { status: 400 });
    }

    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });

    const upload = await mux.video.uploads.retrieve(uploadId);
    
    console.log('📤 Upload status check:', upload.id, '→ asset_id:', upload.asset_id);

    return NextResponse.json({
      assetId: upload.asset_id || null,
      status: upload.status,
    });
  } catch (error: any) {
    console.error('❌ Upload status failed:', error.message);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}