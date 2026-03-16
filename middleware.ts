// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();

  const protectedPaths = ['/dashboard', '/upload', '/videos', '/compare', '/account'];
  if (!session && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const authPaths = ['/login', '/signup'];
  if (session && authPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/videos/:path*',
    '/compare/:path*',
    '/account/:path*',
    '/login',
    '/signup',
  ],
};