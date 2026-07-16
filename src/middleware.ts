import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require wallet connection
const publicPaths = ['/', '/wallet'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') && (
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2') ||
      pathname.endsWith('.ttf') ||
      pathname.endsWith('.eot')
    )
  ) {
    return NextResponse.next();
  }

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
     * - _next (Next.js internals)
     * - Static files with extensions
     */
    '/((?!api|_next).*)',
  ],
};
