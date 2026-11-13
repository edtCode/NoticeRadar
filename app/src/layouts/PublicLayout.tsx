import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/helpers';
import { Menu, X } from 'lucide-react';
import { OpporaLogo } from '../components/brand';
import { ROUTES } from '../constants';

const PUBLIC_NAV_LINKS = [
  { label: 'Features', href: ROUTES.FEATURES },
  { label: 'How It Works', href: ROUTES.HOW_IT_WORKS },
];

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-bg-elevated/95">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
          <div className="space-y-4">
            <Link to="/" aria-label="Oppora Home">
              <OpporaLogo size="md" />
            </Link>
            <p className="max-w-xs text-body-sm text-text-muted">
              Your college updates, all in one place.
            </p>
          </div>

          <nav aria-label="Product links">
            <h4 className="mb-3 text-body-sm font-semibold text-text">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-body-sm text-text-muted transition-colors hover:text-text">Features</Link></li>
              <li><Link to="/student/help" className="text-body-sm text-text-muted transition-colors hover:text-text">Support</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h4 className="mb-3 text-body-sm font-semibold text-text">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-body-sm text-text-muted transition-colors hover:text-text">Login</Link></li>
              <li><Link to="/register" className="text-body-sm text-text-muted transition-colors hover:text-text">Get Started</Link></li>
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h4 className="mb-3 text-body-sm font-semibold text-text">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-body-sm text-text-muted transition-colors hover:text-text">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-body-sm text-text-muted transition-colors hover:text-text">Terms of Service</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-text-muted">
            © {new Date().getFullYear()} Oppora. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/how-it-works" className="magnetic-hover btn-secondary btn-sm soft-aurora">
              Need Help
            </Link>
            <Link to="/register" className="magnetic-hover btn-primary btn-sm soft-aurora">
              Get Started
            </Link>
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

            <div className="hidden items-center gap-2 justify-self-end md:flex">
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