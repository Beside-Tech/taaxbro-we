import { NextRequest, NextResponse } from 'next/server';

// ─── Hostname classification ────────────────────────────────────────────────

function getPortal(req: NextRequest): 'marketing' | 'app' | 'accountant' | 'admin' {
  const host = req.headers.get('host') ?? '';

  // Local dev: localhost / 127.0.0.1 should serve marketing
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return 'marketing';

  if (host.startsWith('app.')) return 'app';
  if (host.startsWith('accountant.')) return 'accountant';
  if (host.startsWith('admin.')) return 'admin';

  // taaxbro.com / www.taaxbro.com → marketing
  return 'marketing';
}

// ─── Path sets ──────────────────────────────────────────────────────────────

const APP_PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

const MARKETING_PATHS = ['/', '/features', '/pricing', '/support'];

// Paths that belong to the marketing site — block on app subdomain
const MARKETING_ONLY_PATHS = ['/(marketing)', '/features', '/pricing', '/support'];

// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const portal = getPortal(req);

  // Always pass through Next internals and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ── Marketing portal (taaxbro.com) ──────────────────────────────────────
  if (portal === 'marketing') {
    // Block dashboard and auth routes on the marketing site
    const isAppRoute =
      APP_PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
      pathname.startsWith('/overview') ||
      pathname.startsWith('/books') ||
      pathname.startsWith('/pay') ||
      pathname.startsWith('/tax') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/onboarding');

    if (isAppRoute) {
      // Redirect to app subdomain
      const appUrl = req.nextUrl.clone();
      appUrl.host = req.nextUrl.host.replace(/^(www\.)?/, 'app.');
      return NextResponse.redirect(appUrl);
    }

    return NextResponse.next();
  }

  // ── Accountant portal (Phase 2) ─────────────────────────────────────────
  if (portal === 'accountant') {
    const appUrl = req.nextUrl.clone();
    appUrl.host = req.nextUrl.host.replace('accountant.', 'app.');
    appUrl.pathname = '/login';
    return NextResponse.redirect(appUrl);
  }

  // ── Admin portal (Phase 3) ───────────────────────────────────────────────
  if (portal === 'admin') {
    const appUrl = req.nextUrl.clone();
    appUrl.host = req.nextUrl.host.replace('admin.', 'app.');
    appUrl.pathname = '/login';
    return NextResponse.redirect(appUrl);
  }

  // ── App portal (app.taaxbro.com / localhost) ─────────────────────────────

  const isLocalHost =
    req.headers.get('host')?.startsWith('localhost') ||
    req.headers.get('host')?.startsWith('127.0.0.1');

  // Block marketing-only paths on app subdomain — redirect to marketing site
  const isMarketingOnly =
    MARKETING_PATHS.includes(pathname) ||
    MARKETING_ONLY_PATHS.some((p) => pathname.startsWith(p));

  if (isMarketingOnly && !isLocalHost) {
    const marketingUrl = req.nextUrl.clone();
    marketingUrl.host = req.nextUrl.host.replace('app.', '');
    return NextResponse.redirect(marketingUrl);
  }

  // Public auth paths — no token required
  if (APP_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect all other app routes — require access_token cookie
  const token = req.cookies.get('access_token');
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|jpeg)$).*)'],
};