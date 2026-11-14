import { Link } from 'react-router-dom';
import { ContainerScroll, FeaturesShowcase } from '../../components/ui';
import { OpporaMark } from '../../components/brand';
import { cn } from '../../utils/helpers';
import {
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  LayoutGrid,
  LayoutTemplate,
  Search,
  Users,
} from 'lucide-react';

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

/* Fictional, clearly illustrative notice titles — never a claim about real listings. */
const PREVIEW_NOTICES = [
  {
    tag: 'Placement',
    title: 'Final-year placement drive · registration open',
    meta: 'Closes in 3 days',
    eligible: true,
    wash: 'from-accent/35 via-accent/10 to-transparent',
    chip: 'border-accent/40 text-accent',
  },
  {
    tag: 'Scholarship',
    title: 'Merit-cum-means scholarship, 2026–27',
    meta: 'Closes in 12 days',
    wash: 'from-coral/35 via-coral/10 to-transparent',
    chip: 'border-coral/40 text-coral',
  },
  {
    tag: 'Event',
    title: 'Inter-college hackathon · team registration',
    meta: 'Closes in 21 days',
    wash: 'from-info/35 via-info/10 to-transparent',
    chip: 'border-info/40 text-info',
  },
];

function HeroPreview() {
  return (
    <div className="flex h-full w-full text-left">
      {/* Sidebar */}
      <aside className="hidden w-[236px] shrink-0 flex-col gap-1 border-r border-border bg-bg-elevated/60 p-3 md:flex">
        <div className="mb-3 flex items-center gap-2 px-2 py-1">
          <OpporaMark size="sm" />
          <span className="font-display text-body font-bold tracking-[-0.03em] text-text">Oppora</span>
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
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-caption',
                item.active
                  ? 'bg-bg-hover font-semibold text-text'
                  : 'text-text-muted'
              )}
            >
              <item.icon
                className={cn('h-3.5 w-3.5', item.active && 'text-accent')}
                aria-hidden="true"
              />
              {item.label}
            </div>
          ))}
        </nav>

        <p className="meta-label mb-1 mt-4 px-2.5">Explore</p>
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
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2 md:hidden">
            <OpporaMark size="sm" />
            <span className="font-display text-body-sm font-bold text-text">Oppora</span>
          </div>
          <div className="hidden flex-1 items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5 md:flex">
            <Search className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            <span className="text-caption text-text-muted">Search notices, companies, deadlines…</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="h-6 w-6 rounded-full bg-accent" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-body font-semibold tracking-[-0.01em] text-text">New &amp; noteworthy</h3>
              <p className="text-caption text-text-muted">The best notices from the last month</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-caption text-text-muted">
              View all
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {PREVIEW_NOTICES.map((card, index) => (
              <div
                key={card.tag}
                className={cn(
                  'overflow-hidden rounded-lg border border-border bg-bg-elevated',
                  index === 2 && 'hidden md:block'
                )}
              >
                <div className={cn('h-16 bg-gradient-to-br', card.wash)} aria-hidden="true" />
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold', card.chip)}>
                      {card.tag}
                    </span>
                    {card.eligible && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Eligible
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium leading-snug text-text">{card.title}</p>
                  <p className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {card.meta}
                  </p>
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
                  className="mx-auto max-w-4xl text-[clamp(2.75rem,7.5vw,5rem)] font-bold leading-[1.02] tracking-[-0.04em] text-text text-balance animate-slide-up"
                  style={{ animationDelay: '120ms' }}
                >
                  Never miss an <span className="marker-loud marker-stamp text-loud-ink">important</span> notice.
                </h1>
                <p
                  className="mx-auto mt-6 max-w-xl text-body leading-relaxed text-text-muted text-pretty animate-slide-up sm:text-lg"
                  style={{ animationDelay: '340ms' }}
                >
                  All your college announcements, internships, placement opportunities, scholarships and deadlines in one personalised platform.
                </p>
                <div
                  className="mt-9 flex flex-col items-center justify-center gap-3 animate-slide-up sm:flex-row sm:gap-4"
                  style={{ animationDelay: '560ms' }}
                >
                  <Link
                    to="/register"
                    className="magnetic-hover btn-primary btn-lg btn-cta-breathe group soft-aurora w-full sm:w-auto"
                  >
                    Get started
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link to="/how-it-works" className="magnetic-hover btn-secondary btn-lg soft-aurora w-full sm:w-auto">
                    See how it works
                  </Link>
                </div>

                <ul
                  className="mx-auto mb-10 mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-caption text-text-muted animate-slide-up"
                  style={{ animationDelay: '720ms' }}
                >
                  {[
                    'Official notices only',
                    'Eligibility explained in plain language',
                    'Every deadline in one calendar',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent/80" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
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

      {/* Closing invitation — the page ends on the one decision it wants */}
      <section className="relative overflow-hidden">
        <div className="hero-bloom pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[1400px] px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(2rem,4.4vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.035em] text-text">
            Your next deadline should never be a surprise.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-body leading-relaxed text-text-muted text-pretty sm:text-lg">
            Set up your profile once. Oppora reads the notices, explains what applies to you, and keeps the closing dates in view.
          </p>
          <div className="mx-auto mt-9 flex max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
            <Link to="/register" className="magnetic-hover btn-primary btn-lg group w-full sm:w-auto">
              Get started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/features" className="magnetic-hover btn-secondary btn-lg w-full sm:w-auto">
              Explore features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
