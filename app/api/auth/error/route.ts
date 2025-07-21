import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');

  let errorMessage = 'An error occurred during authentication';
  let statusCode = 400;

  switch (error) {
    case 'Configuration':
      errorMessage = 'There is a problem with the server configuration.';
      statusCode = 500;
      break;
    case 'AccessDenied':
      errorMessage = 'Access denied. You do not have permission to access this resource.';
      statusCode = 403;
      break;
    case 'Verification':
      errorMessage = 'The token has expired or is invalid.';
      statusCode = 401;
      break;
    case 'Default':
    default:
      errorMessage = 'An unexpected error occurred.';
      statusCode = 500;
  }

  return NextResponse.json(
    { error: errorMessage },
    { status: statusCode }
  );
} 