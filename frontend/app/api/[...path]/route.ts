import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface CookieOptions {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number;
  expires?: Date;
}

function parseCookie(cookieStr: string): CookieOptions {
  const parts = cookieStr.split(';').map(p => p.trim());
  const [nameVal, ...attrs] = parts;
  const eqIdx = nameVal.indexOf('=');
  const name = nameVal.substring(0, eqIdx);
  const value = nameVal.substring(eqIdx + 1);

  const opts: CookieOptions = { name, value };

  for (const attr of attrs) {
    const [key, val] = attr.split('=');
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'httponly') {
      opts.httpOnly = true;
    } else if (lowerKey === 'secure') {
      opts.secure = true;
    } else if (lowerKey === 'path') {
      opts.path = val;
    } else if (lowerKey === 'max-age') {
      opts.maxAge = parseInt(val, 10);
    } else if (lowerKey === 'samesite') {
      const lowerVal = val.toLowerCase();
      if (lowerVal === 'lax' || lowerVal === 'strict' || lowerVal === 'none') {
        opts.sameSite = lowerVal;
      }
    } else if (lowerKey === 'expires') {
      opts.expires = new Date(val);
    }
  }

  return opts;
}

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const url = `${BACKEND}${pathname}${search}`;

  const reqHeaders: Record<string, string> = {};
  
  // Hop-by-hop and encoding headers that should NOT be forwarded to the backend
  const requestHeadersToStrip = new Set([
    'host',
    'connection',
    'content-length',
    'transfer-encoding',
    'content-encoding',
    'keep-alive',
    'accept-encoding', // Let fetch handle compression automatically
  ]);

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!requestHeadersToStrip.has(lowerKey)) {
      reqHeaders[key] = value;
    }
  });

  // Reconstruct Cookie header from request.cookies to be 100% safe
  const cookieList = request.cookies.getAll();
  if (cookieList.length > 0) {
    reqHeaders['cookie'] = cookieList.map(c => `${c.name}=${c.value}`).join('; ');
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

  // Copy response headers, stripping hop-by-hop and compression headers
  // (because fetch decompresses the body, so forwarding content-encoding/length breaks the browser)
  const resHeaders = new Headers();
  const responseHeadersToStrip = new Set([
    'set-cookie',
    'connection',
    'transfer-encoding',
    'content-encoding',
    'content-length',
  ]);

  backendRes.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!responseHeadersToStrip.has(lowerKey)) {
      resHeaders.set(key, value);
    }
  });

  const response = new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: resHeaders,
  });

  // Set cookies natively on the NextResponse object
  if (typeof backendRes.headers.getSetCookie === 'function') {
    const cookies = backendRes.headers.getSetCookie();
    for (const cookie of cookies) {
      try {
        const parsed = parseCookie(cookie);
        response.cookies.set(parsed.name, parsed.value, {
          httpOnly: parsed.httpOnly,
          secure: parsed.secure,
          path: parsed.path,
          maxAge: parsed.maxAge,
          sameSite: parsed.sameSite,
          expires: parsed.expires,
        });
      } catch (err) {
        console.error('[proxy] Cookie parse error:', err);
      }
    }
  } else {
    const setCookie = backendRes.headers.get('set-cookie');
    if (setCookie) {
      try {
        const parsed = parseCookie(setCookie);
        response.cookies.set(parsed.name, parsed.value, {
          httpOnly: parsed.httpOnly,
          secure: parsed.secure,
          path: parsed.path,
          maxAge: parsed.maxAge,
          sameSite: parsed.sameSite,
          expires: parsed.expires,
        });
      } catch (err) {
        console.error('[proxy] Cookie parse error:', err);
      }
    }
  }

  return response;
}

export async function GET(request: NextRequest)     { return proxyRequest(request); }
export async function POST(request: NextRequest)    { return proxyRequest(request); }
export async function PUT(request: NextRequest)     { return proxyRequest(request); }
export async function DELETE(request: NextRequest)  { return proxyRequest(request); }
export async function PATCH(request: NextRequest)   { return proxyRequest(request); }
export async function OPTIONS(request: NextRequest) { return proxyRequest(request); }
