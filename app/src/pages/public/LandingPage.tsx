import { Link, useNavigate } from 'react-router-dom';
import { ContainerScroll } from '../../components/ui';
import { OpporaMark } from '../../components/brand';
import { FeatureOrbitCarousel, type Feature } from '../../components/ui/feature-orbit-carousel';
import { ArrowRight, Search, Bell, Bookmark, Calendar, Home, ChevronRight, LayoutGrid, LayoutTemplate, Users } from 'lucide-react';

/**
 * Self-contained orbit artwork: a dark disc with an accent ring and the
 * feature's line icon at the centre. Square and transparent, so it sits on
 * the orbit like a plate without fetching anything off-origin.
 */
function featureArt(accent: string, glyph: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
    '<defs><radialGradient id="g" cx="38%" cy="30%" r="78%">' +
    '<stop offset="0" stop-color="#2a2214"/><stop offset="1" stop-color="#110d07"/>' +
    '</radialGradient></defs>' +
    '<circle cx="256" cy="256" r="244" fill="url(#g)" stroke="' + accent + '" stroke-opacity=".5" stroke-width="3"/>' +
    '<circle cx="256" cy="256" r="206" fill="none" stroke="#dfc5a2" stroke-opacity=".1" stroke-width="2"/>' +
    '<circle cx="256" cy="256" r="152" fill="' + accent + '" fill-opacity=".13" stroke="' + accent + '" stroke-opacity=".32" stroke-width="1.5"/>' +
    '<g transform="translate(256 256) scale(7.2) translate(-12 -12)" fill="none" stroke="#dfc5a2" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    glyph +
    '</g>' +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const GLYPH_FEED =
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>';
const GLYPH_AI =
  '<path d="M12 3l1.8 5.4L19 10.2l-5.2 1.8L12 17.4l-1.8-5.4L5 10.2l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>';
const GLYPH_MATCH =
  '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="#dfc5a2" stroke="none"/>';
const GLYPH_BELL =
  '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>';

const FEATURE_ITEMS: Feature[] = [
  {
    title: 'Centralised',
    subtitle: 'Notice feed',
    label: 'Centralised notice feed',
    eyebrow: '#1 Core capability',
    image: featureArt('#c4f204', GLYPH_FEED),
    alt: 'Document icon inside a lime-ringed disc',
    audience: 'For every student',
    context: 'One searchable feed',
    description:
      'Every official notice from your institution lands in a single feed, with filters and saved items so nothing gets lost.',
    capabilities: ['Search', 'Filters', 'Saved items', 'Categories'],
    saves: 2480,
    accent: '#c4f204',
  },
  {
    title: 'AI extraction',
    subtitle: '& summaries',
    label: 'AI extraction & summaries',
    eyebrow: '#2 Core capability',
    image: featureArt('#caaf90', GLYPH_AI),
    alt: 'Sparkle icon inside a sand-ringed disc',
    audience: 'For administrators',
    context: 'PDF to structured data',
    description:
      'Upload a PDF and Oppora extracts deadlines, eligibility, documents and a summary — with the original source always visible.',
    capabilities: ['PDF parsing', 'AI summary', 'Deadline extraction', 'Original source'],
    saves: 1960,
    accent: '#caaf90',
  },
  {
    title: 'Personalised',
    subtitle: 'Eligibility',
    label: 'Personalised eligibility',
    eyebrow: '#3 Core capability',
    image: featureArt('#86efac', GLYPH_MATCH),
    alt: 'Target icon inside a green-ringed disc',
    audience: 'For students',
    context: 'Verdicts you can trust',
    description:
      'Your academic profile powers a tailored feed with transparent verdicts, reasons and missing fields for every notice.',
    capabilities: ['Profile matching', 'Verdict reasons', 'Missing fields', 'Tailored feed'],
    saves: 3120,
    accent: '#86efac',
  },
  {
    title: 'Reminders &',
    subtitle: 'Verified publishing',
    label: 'Reminders & verified publishing',
    eyebrow: '#4 Core capability',
    image: featureArt('#fcd34d', GLYPH_BELL),
    alt: 'Bell icon inside an amber-ringed disc',
    audience: 'Students + admins',
    context: 'Nothing slips through',
    description:
      'Students get automatic deadline reminders while administrators review, correct and approve every notice before it publishes.',
    capabilities: ['Deadline reminders', 'Admin review', 'Corrections', 'Verified publishing'],
    saves: 1540,
    accent: '#fcd34d',
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Register & Complete Profile',
    description: 'Students sign up and fill in their academic details — institution, department, branch, semester, CPI, graduation year, backlogs, and interests.',
  },
  {
    step: 2,
    title: 'Admins Upload Official Notices',
    description: 'Institution administrators upload official PDF notices from departments, placement cells, or the registrar.',
  },
  {
    step: 3,
    title: 'AI Extracts & Structures Information',
    description: 'Oppora extracts text from the PDF and uses AI to structure key fields: title, category, deadline, eligibility criteria, required documents, and more.',
  },
  {
    step: 4,
    title: 'Admin Verifies & Approves',
    description: 'Administrators review the extracted data side-by-side with the original PDF, correct any errors, and approve the notice for publishing.',
  },
  {
    step: 5,
    title: 'Students Discover & Track',
    description: 'Students see personalised feeds with eligibility verdicts, save relevant notices, and receive automatic deadline reminders.',
  },
];

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
      <aside className="hidden w-[240px] shrink-0 flex-col gap-1 border-r border-border bg-bg-elevated p-3 sm:flex">
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

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero — the heading block and the product preview share one scroll-driven 3D card reveal */}
      <section className="relative overflow-hidden">
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


      {/* Features — pinned orbit carousel driven by scroll, buttons, keys and swipes */}
      <section aria-label="Features" className="border-b border-border">
        <FeatureOrbitCarousel
          features={FEATURE_ITEMS}
          height="100svh"
          loop={false}
          onPreview={() => navigate('/features')}
          onGetStarted={() => navigate('/register')}
        />
      </section>

    </div>
  );
}
