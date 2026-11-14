import { Link } from 'react-router-dom';
import { ContainerScroll, FeaturesShowcase } from '../../components/ui';
import { OpporaMark } from '../../components/brand';
import { ArrowRight, Search, Bell, Bookmark, Calendar, Home, ChevronRight, LayoutGrid, LayoutTemplate, Users } from 'lucide-react';

const PREVIEW_NAV = [
  { icon: Home, label: 'Home', active: true },
  { icon: Bell, label: 'Notices' },
  { icon: Bookmark, label: 'Saved' },
  { icon: Calendar, label: 'Reminders' },
];

const PREVIEW_EXPLORE = [
  { icon: LayoutGrid, label: 'Categories' },
  { icon: LayoutTemplate, label: 'Templates' },
  { icon: Users, label: 'Institutions' },
];

function HeroPreview() {
  return (
    <div className="flex h-full w-full text-left">
      {/* Sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col gap-1 border-r border-border bg-bg-elevated p-3 md:flex">
        <div className="mb-3 flex items-center gap-2 px-2 py-1">
          <OpporaMark size="sm" />
          <span className="font-display text-body font-bold tracking-tight text-text">Oppora</span>
        </div>

        <div className="mb-2 flex items-center justify-between rounded-md border border-border bg-bg px-2.5 py-1.5 text-text-muted">
          <span className="flex items-center gap-2 text-caption">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Search
          </span>
          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] leading-none">⌘K</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {PREVIEW_NAV.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-caption ${
                item.active ? 'bg-bg-hover font-medium text-text' : 'text-text-muted'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </div>
          ))}
        </nav>

        <p className="mb-1 mt-3 px-2.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Explore
        </p>
        <nav className="flex flex-col gap-0.5">
          {PREVIEW_EXPLORE.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-caption text-text-muted"
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </span>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2 sm:hidden">
            <OpporaMark size="sm" />
            <span className="font-display text-body-sm font-bold text-text">Oppora</span>
          </div>
          <div className="hidden h-2.5 w-28 rounded-full bg-bg-hover sm:block" />
          <div className="flex items-center gap-3">
            <Bookmark className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="h-6 w-6 rounded-full bg-accent" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-h4 font-semibold text-text">New &amp; noteworthy</h3>
              <p className="text-caption text-text-muted">The best notices from the last month</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-caption text-text-muted">
              View all
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { tone: 'from-accent/25 to-accent/5', tag: 'Placement' },
              { tone: 'from-coral/25 to-coral/5', tag: 'Scholarship' },
              { tone: 'from-info/25 to-info/5', tag: 'Event' },
            ].map((card) => (
              <div key={card.tag} className="overflow-hidden rounded-lg border border-border bg-bg-elevated">
                <div className={`h-20 bg-gradient-to-br ${card.tone}`} aria-hidden="true" />
                <div className="space-y-2 p-3">
                  <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted">
                    {card.tag}
                  </span>
                  <div className="h-2 w-full rounded-full bg-bg-hover" aria-hidden="true" />
                  <div className="h-2 w-2/3 rounded-full bg-bg-hover" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero — the heading block and the product preview share one scroll-driven 3D card reveal */}
      <section className="relative -mt-20 overflow-hidden pt-20">
        <div className="hero-bloom pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <ContainerScroll
            titleComponent={
              <>
                <h1
                  className="mx-auto max-w-4xl text-[clamp(2.75rem,7.5vw,5rem)] font-bold leading-[1.02] tracking-tighter text-text text-balance animate-slide-up"
                  style={{ animationDelay: '120ms' }}
                >
                  Never miss an important notice.
                </h1>
                <p
                  className="mx-auto mt-6 max-w-2xl text-h3 text-text-muted animate-slide-up"
                  style={{ animationDelay: '340ms' }}
                >
                  All your college announcements, internships, placement opportunities, scholarships and deadlines in one personalised platform.
                </p>
                <div
                  className="mt-10 mb-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up"
                  style={{ animationDelay: '560ms' }}
                >
                  <Link to="/register" className="magnetic-hover btn-primary btn-lg btn-cta-breathe group soft-aurora">
                    Get Started
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link to="/features" className="magnetic-hover btn-secondary btn-lg soft-aurora">
                    Explore Features
                  </Link>
                </div>
              </>
            }
          >
            <HeroPreview />
          </ContainerScroll>
        </div>
      </section>


      {/* Features — the same ticker-cell showcase used on /features, demoted to h2 */}
      <section aria-label="Features" className="border-b border-border">
        <FeaturesShowcase headingLevel={2} />
      </section>

    </div>
  );
}
