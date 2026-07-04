import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require wallet connection
const publicPaths = ['/', '/wallet'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Check for wallet connection in cookies
  const walletConnected = request.cookies.get('wallet-connected');

  // Only redirect if not connected and NOT already on /wallet or /
  if (!walletConnected) {
    // Defensive: never redirect loop
    if (pathname !== '/wallet' && pathname !== '/') {
      const url = new URL('/wallet', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    // If already on /wallet or /, just allow
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
