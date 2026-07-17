import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const url = `${BACKEND}${pathname}${search}`;

  const reqHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      reqHeaders[key] = value;
    }
  });

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    reqHeaders['cookie'] = cookieHeader;
  }

  const fetchOptions: RequestInit & { duplex?: string } = {
    method: request.method,
    headers: reqHeaders,
    redirect: 'manual',
    cache: 'no-store',
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

  const resHeaders = new Headers();
  
  if (typeof backendRes.headers.getSetCookie === 'function') {
    const cookies = backendRes.headers.getSetCookie();
    for (const cookie of cookies) {
      resHeaders.append('Set-Cookie', cookie);
    }
  } else {
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
