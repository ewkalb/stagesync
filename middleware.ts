// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClientSsr } from './lib/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = await createServerClientSsr();  // <-- await the async creator

  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  const publicRoutes = ['/', '/login', '/signup'];
  const protectedRoutes = ['/dashboard', '/upload', '/compare']; // add as we create them

  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/');
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};