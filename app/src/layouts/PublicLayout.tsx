import { type ReactNode } from 'react';
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/helpers';
import { Menu, X } from 'lucide-react';
import { OpporaLogo } from '../components/brand';

const PUBLIC_NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
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
              <li><Link to="/privacy" className="text-body-sm text-text-muted transition-colors hover:text-text">Privacy Policy</Link></li>
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

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-bg-elevated/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" aria-label="Oppora Home">
              <OpporaLogo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {PUBLIC_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-body-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'text-accent'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-border animate-slide-down">
            <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
              {PUBLIC_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-2 py-2 text-body font-medium text-text-muted hover:text-text hover:bg-bg-hover rounded-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                <Link
                  to="/login"
                  className="px-2 py-2 text-body font-medium text-text text-center hover:bg-bg-hover rounded-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary w-full text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-8">
        <Outlet />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}