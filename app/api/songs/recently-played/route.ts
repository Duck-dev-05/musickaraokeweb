import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    // TODO: Save to database or update recently played logic here

    // For now, just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recently played' }, { status: 500 });
  }
} 