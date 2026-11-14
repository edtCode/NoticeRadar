import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/helpers';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { OpporaLogo } from '../components/brand';
import { GITHUB_URL, LEGAL_CONTACT_EMAIL, ROUTES } from '../constants';

const PUBLIC_NAV_LINKS = [
  { label: 'Features', href: ROUTES.FEATURES },
  { label: 'How It Works', href: ROUTES.HOW_IT_WORKS },
];

/** GitHub mark — the icon set dropped brand glyphs, so this is drawn inline. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.4-3.88-1.4-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

const FOOTER_NAV = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: ROUTES.FEATURES },
      { label: 'How it works', href: ROUTES.HOW_IT_WORKS },
      { label: 'Create account', href: ROUTES.REGISTER },
    ],
  },
  {
    title: 'Students',
    links: [
      { label: 'Sign in', href: ROUTES.LOGIN },
      { label: 'Support', href: ROUTES.STUDENT_HELP },
      { label: 'Contact', href: `mailto:${LEGAL_CONTACT_EMAIL}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: ROUTES.PRIVACY },
      { label: 'Terms of service', href: ROUTES.TERMS },
    ],
  },
] as const;

/** Footer link: internal routes keep in-app navigation, mailto and URLs open directly. */
function FooterLink({ label, href }: { label: string; href: string }) {
  const isExternal = href.startsWith('mailto:') || href.startsWith('http');
  const className =
    'group inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text';

  const inner = (
    <>
      <span className="relative">
        {label}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-[width] duration-200 group-hover:w-full"
        />
      </span>
      {isExternal && (
        <ArrowUpRight
          className="h-3.5 w-3.5 -translate-y-px opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {inner}
    </Link>
  );
}

function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border bg-bg-elevated/40">
      <div className="hero-bloom pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-14 sm:grid-cols-2 sm:py-16 md:grid-cols-[1.7fr_1fr_1fr_1fr] lg:gap-16">
          {/* Brand, promise and the two things a visitor can do from here */}
          <div className="space-y-5 sm:col-span-2 md:col-span-1">
            <Link to={ROUTES.HOME} aria-label="Oppora home" className="inline-flex">
              <OpporaLogo size="md" />
            </Link>

            <p className="max-w-xs text-body-sm leading-relaxed text-text-muted text-pretty">
              Your college updates, all in one place — official notices, explained eligibility and every deadline.
            </p>

            <p className="flex max-w-xs items-start gap-2 text-caption leading-relaxed text-text-muted">
              <span
                className="mt-[0.35rem] size-1.5 flex-shrink-0 rounded-full bg-accent animate-pulse-soft"
                aria-hidden="true"
              />
              A notice only publishes after an administrator approves it.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-secondary btn-sm group gap-2"
                aria-label="Oppora on GitHub (opens in a new tab)"
              >
                <GithubMark className="h-4 w-4" />
                GitHub
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
              <Link to={ROUTES.REGISTER} className="btn-primary btn-sm">
                Get started
              </Link>
            </div>
          </div>

          {FOOTER_NAV.map((column) => (
            <nav key={column.title} aria-label={`${column.title} links`} className="md:pt-1">
              <h2 className="meta-label mb-4">{column.title}</h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink label={link.label} href={link.href} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Legal line, then the wordmark as the last thing the visitor sees */}
      <div className="relative border-t border-border">
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 text-caption text-text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Oppora. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-border-strong" aria-hidden="true" />
              Built for students. Reviewed by institutions.
            </p>
          </div>

          <div className="-mb-1 mt-6 select-none overflow-hidden" aria-hidden="true">
            <span className="block font-display text-[clamp(3.75rem,17vw,12rem)] font-bold leading-[0.78] tracking-[-0.06em] text-text/5">
              Oppora<span className="text-accent/30">.</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // A menu left open across a route change would cover the page the visitor
  // just navigated to, so close it whenever the path changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Floating navigation pill */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
          <div className="mt-3 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border border-border bg-bg-elevated/95 pl-4 pr-2 shadow-[0_20px_50px_-32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:pl-5 sm:pr-3">
            <Link
              to={ROUTES.HOME}
              aria-label="Oppora home"
              className="justify-self-start rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <OpporaLogo size="sm" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              {PUBLIC_NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center rounded-full px-4 py-2 text-body-sm font-medium transition-colors duration-fast',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                      isActive
                        ? 'bg-bg-hover text-text'
                        : 'text-text-muted hover:bg-bg-hover/60 hover:text-text'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-1 justify-self-end md:flex">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Oppora on GitHub (opens in a new tab)"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <GithubMark className="h-[18px] w-[18px]" />
              </a>
              <Link to={ROUTES.LOGIN} className="btn-ghost btn-sm">
                Log in
              </Link>
              <Link to={ROUTES.REGISTER} className="btn-primary btn-sm">
                Get Started
              </Link>
            </div>

            <button
              type="button"
              className="col-start-3 justify-self-end rounded-full p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div
              id="mobile-menu"
              className="mt-2 animate-slide-down rounded-2xl border border-border bg-bg-elevated/95 p-3 shadow-[0_24px_60px_-36px_rgba(0,0,0,0.95)] backdrop-blur-xl md:hidden"
            >
              <nav className="flex flex-col" aria-label="Mobile navigation">
                {PUBLIC_NAV_LINKS.map((link) => {
                  const isActive = location.pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'rounded-xl px-3 py-2.5 text-body font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                        isActive ? 'bg-bg-hover text-text' : 'text-text-muted hover:bg-bg-hover/60 hover:text-text'
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-body font-medium text-text-muted transition-colors hover:bg-bg-hover/60 hover:text-text"
                >
                  <GithubMark className="h-4 w-4" />
                  GitHub
                  <ArrowUpRight className="ml-auto h-4 w-4" aria-hidden="true" />
                </a>

                <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                  <Link
                    to={ROUTES.LOGIN}
                    className="rounded-xl px-3 py-2.5 text-center text-body font-medium text-text transition-colors hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    Log in
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="btn-primary w-full text-center"
                  >
                    Get Started
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-8">
        <Outlet />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}