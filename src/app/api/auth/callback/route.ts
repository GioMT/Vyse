import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

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
          const response = NextResponse.redirect(new URL(next, request.url));
          
          // Set active session cookie for middleware parity
          response.cookies.set('pt_session_active', 'true', {
            path: '/',
            maxAge: 86400,
            sameSite: 'lax',
          });
          
          return response;
        }
      } catch (e) {
        console.error('Auth callback error during token exchange:', e);
      }
    }
  }

  // Default redirect if auth fails or keys are missing
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
