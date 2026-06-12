import { NextRequest, NextResponse } from 'next/server';

// ─── Token expiration helper ───────────────────────────────────────────────

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ─── Hostname classification ────────────────────────────────────────────────

function getPortal(req: NextRequest): 'marketing' | 'app' | 'accountant' | 'admin' {
  const host = req.headers.get('host') ?? '';

  // Local dev: treat as app portal so dashboard routes work without a subdomain
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return 'app';

  if (host.startsWith('app.')) return 'app';
  if (host.startsWith('accountant.')) return 'accountant';
  if (host.startsWith('admin.')) return 'admin';

  // taaxbro.com / www.taaxbro.com → marketing
  return 'marketing';
}

// ─── Path sets ──────────────────────────────────────────────────────────────

// Auth routes that don't need a token (public on the app subdomain)
const APP_PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
  // Google OAuth callback — the backend sets the cookie and redirects here.
  // The middleware must NOT require a cookie on this path or the redirect loop.
  '/auth/callback',
];

// Dashboard routes that require a token
const APP_PROTECTED_PATHS = [
  '/overview',
  '/books',
  '/pay',
  '/tax',
  '/settings',
  '/onboarding',
];

// Paths that only exist on the marketing site — redirect away on app subdomain.
const MARKETING_ONLY_PATHS = ['/features', '/pricing', '/support'];

// ─── RSC / prefetch detection ────────────────────────────────────────────────
function isNextInternalFetch(req: NextRequest): boolean {
  return (
    req.nextUrl.searchParams.has('_rsc') ||
    req.headers.get('rsc') === '1' ||
    req.headers.get('next-router-prefetch') === '1' ||
    req.headers.get('next-router-state-tree') !== null
  );
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const portal = getPortal(req);

  // Always pass through Next.js internals and backend API proxy routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ── Marketing portal ────────────────────────────────────────────────────
  if (portal === 'marketing') {
    const isAppRoute =
      APP_PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
      APP_PROTECTED_PATHS.some((p) => pathname.startsWith(p));

    if (isAppRoute) {
      const appUrl = req.nextUrl.clone();
      appUrl.host = req.nextUrl.host.replace(/^(www\.)?/, 'app.');
      return NextResponse.redirect(appUrl);
    }

    return NextResponse.next();
  }

  // ── Accountant portal (Phase 2) ──────────────────────────────────────────
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

  // ── App portal (app.taaxbro.com) ─────────────────────────────────────────

  // Root path
  if (pathname === '/') {
    if (isNextInternalFetch(req)) return NextResponse.next();
    const currentHost = req.nextUrl.host;
    if (currentHost.startsWith('app.')) {
      const marketingUrl = req.nextUrl.clone();
      marketingUrl.host = currentHost.replace(/^app\./, '');
      return NextResponse.redirect(marketingUrl);
    }
    return NextResponse.next();
  }

  // Marketing-only paths
  const isMarketingOnly = MARKETING_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (isMarketingOnly) {
    if (isNextInternalFetch(req)) return NextResponse.next();
    const currentHost = req.nextUrl.host;
    if (currentHost.startsWith('app.')) {
      const marketingUrl = req.nextUrl.clone();
      marketingUrl.host = currentHost.replace(/^app\./, '');
      return NextResponse.redirect(marketingUrl);
    }
    return NextResponse.next();
  }

  const tokenCookie = req.cookies.get('access_token');
  const token = tokenCookie?.value;
  const isTokenValid = token && !isTokenExpired(token);

  // Public auth paths — no token required (unless already logged in)
  if (APP_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const redirectIfAuthPaths = ['/login', '/register', '/forgot-password', '/verify'];
    if (isTokenValid && redirectIfAuthPaths.some((p) => pathname.startsWith(p))) {
      const overviewUrl = req.nextUrl.clone();
      overviewUrl.pathname = '/overview';
      return NextResponse.redirect(overviewUrl);
    }
    return NextResponse.next();
  }

  // Protect dashboard routes — require valid access_token cookie
  if (!isTokenValid) {
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