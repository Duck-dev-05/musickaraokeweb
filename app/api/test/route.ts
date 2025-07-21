import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Test POST endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString(),
      status: 'ok'
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Test POST endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      status: 'error'
    }, { status: 500 });
  }
} 