// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  const protectedPaths = ['/dashboard', '/upload', '/videos', '/compare', '/account'];
  const authPaths = ['/login', '/signup'];

  // Redirect unauth from protected to login
  if (!session && protectedPaths.includes(path)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect auth from auth paths to dashboard
  if (session && authPaths.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/upload',
    '/videos',
    '/compare',
    '/account',
    '/login',
    '/signup',
  ],
};