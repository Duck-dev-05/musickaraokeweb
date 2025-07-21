import { NextResponse } from 'next/server';


export async function GET(
  request: Request,
  { params }: { params: { playlistId: string } }
) {
  return NextResponse.json({ 
    message: 'Test route working',
    playlistId: params.playlistId
  });
} 