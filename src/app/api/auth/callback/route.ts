import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getRedirectUrl(request: NextRequest, path: string) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const cleanHost = host.split(',')[0].trim();
  const cleanProto = proto.split(',')[0].trim();
  return new URL(path, `${cleanProto}://${cleanHost}`);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  // If Supabase returned an error directly (e.g. trigger failure), forward it to the landing page
  const errorParam = requestUrl.searchParams.get('error');
  const errorDesc = requestUrl.searchParams.get('error_description');
  if (errorParam) {
    const errorUrl = getRedirectUrl(request, '/');
    errorUrl.searchParams.set('error', errorParam);
    if (errorDesc) errorUrl.searchParams.set('error_description', errorDesc);
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const isUrlValid = supabaseUrl && supabaseUrl.startsWith('http') && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-');

    if (isUrlValid && supabaseAnonKey) {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          const response = NextResponse.redirect(getRedirectUrl(request, next));
          
          // Set active session cookie for middleware parity
          response.cookies.set('pt_session_active', 'true', {
            path: '/',
            maxAge: 86400,
            sameSite: 'lax',
          });
          
          return response;
        }
        // Token exchange failed — redirect home with error
        console.error('Auth callback: exchangeCodeForSession error:', error.message);
        const failUrl = getRedirectUrl(request, '/');
        failUrl.searchParams.set('error', 'auth_callback_failed');
        failUrl.searchParams.set('error_description', error.message);
        return NextResponse.redirect(failUrl);
      } catch (e) {
        console.error('Auth callback error during token exchange:', e);
        const failUrl = getRedirectUrl(request, '/');
        failUrl.searchParams.set('error', 'auth_callback_exception');
        failUrl.searchParams.set('error_description', e instanceof Error ? e.message : 'Unknown error during authentication');
        return NextResponse.redirect(failUrl);
      }
    } else {
      // Supabase not configured
      console.error('Auth callback: Supabase URL or key invalid/missing');
      const failUrl = getRedirectUrl(request, '/');
      failUrl.searchParams.set('error', 'config_error');
      failUrl.searchParams.set('error_description', 'Supabase configuration is missing or invalid');
      return NextResponse.redirect(failUrl);
    }
  }

  // No code parameter — redirect to home
  const homeUrl = getRedirectUrl(request, '/');
  homeUrl.searchParams.set('error', 'missing_code');
  homeUrl.searchParams.set('error_description', 'No authorization code received from provider');
  return NextResponse.redirect(homeUrl);
}
