import { NextRequest, NextResponse } from 'next/server';

/**
 * Proper API proxy route — forwards ALL headers including Cookie and Set-Cookie.
 * This replaces the next.config.js rewrites() approach which doesn't reliably
 * forward Set-Cookie headers on Vercel (causing the 401 after login bug).
 */
const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const url = `${BACKEND}${pathname}${search}`;

  // Forward ALL request headers from browser to backend (including Cookie)
  const reqHeaders = new Headers(request.headers);
  reqHeaders.delete('host');

  const fetchOptions: RequestInit & { duplex?: string } = {
    method: request.method,
    headers: reqHeaders,
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    fetchOptions.body = request.body as BodyInit;
    fetchOptions.duplex = 'half';
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(url, fetchOptions);
  } catch (err) {
    console.error('[proxy] Backend unreachable:', err);
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  // Forward ALL response headers back to browser (including Set-Cookie!)
  const resHeaders = new Headers(backendRes.headers);

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: resHeaders,
  });
}

export async function GET(request: NextRequest)     { return proxyRequest(request); }
export async function POST(request: NextRequest)    { return proxyRequest(request); }
export async function PUT(request: NextRequest)     { return proxyRequest(request); }
export async function DELETE(request: NextRequest)  { return proxyRequest(request); }
export async function PATCH(request: NextRequest)   { return proxyRequest(request); }
export async function OPTIONS(request: NextRequest) { return proxyRequest(request); }
