import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const url = `${BACKEND}${pathname}${search}`;

  // 1. Manually reconstruct headers to ensure Cookie is forwarded properly
  const reqHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      reqHeaders[key] = value;
    }
  });

  // Explicitly ensure cookies are attached
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    reqHeaders['cookie'] = cookieHeader;
  }

  const fetchOptions: RequestInit & { duplex?: string } = {
    method: request.method,
    headers: reqHeaders,
    // prevent fetch from following redirects so we can pass them to the client
    redirect: 'manual', 
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

  // 2. Properly reconstruct response headers, handling Set-Cookie correctly
  const resHeaders = new Headers();
  
  // fetch API merges multiple Set-Cookie headers into one comma-separated string
  // which is invalid for Set-Cookie. We must manually parse and split them.
  // Luckily, backendRes.headers.getSetCookie() is available in newer Node/Next.js
  if (typeof backendRes.headers.getSetCookie === 'function') {
    const cookies = backendRes.headers.getSetCookie();
    for (const cookie of cookies) {
      resHeaders.append('Set-Cookie', cookie);
    }
  } else {
    // Fallback: just copy as-is (might be buggy if multiple cookies are set)
    const setCookie = backendRes.headers.get('set-cookie');
    if (setCookie) {
      resHeaders.set('Set-Cookie', setCookie);
    }
  }

  backendRes.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      resHeaders.set(key, value);
    }
  });

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
