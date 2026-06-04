import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public resources, API routes, and the landing page pass
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for active session cookie
  // - Supabase sets "sb-..." cookies
  // - Our mock auth sets "pt_session_active" cookie
  const hasSupabaseCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'));
  const hasDemoCookie = request.cookies.has('pt_session_active');

  const isAuthenticated = hasSupabaseCookie || hasDemoCookie;

  if (!isAuthenticated) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
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
