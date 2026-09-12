import { NextRequest, NextResponse } from 'next/server';

// Server-side only — never sent to the browser, so no CORS issue.
const UPSTREAM_BASE =
  (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://api.eventstan.com') + '/api/v1/';

// Headers that must not be forwarded as-is (hop-by-hop / host-specific)
const STRIP_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
]);

const STRIP_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'transfer-encoding',
  'connection',
]);

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = (path ?? []).join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${UPSTREAM_BASE}${targetPath}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    // GET/HEAD must not have a body
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    // Required by fetch when streaming a Request body in Node
    // @ts-expect-error - duplex is valid at runtime, missing from TS lib types
    duplex: ['GET', 'HEAD'].includes(req.method) ? undefined : 'half',
    redirect: 'manual',
  };

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, init);
  } catch (err) {
    return NextResponse.json(
      { message: 'Upstream request failed', error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};

export const dynamic = 'force-dynamic';
