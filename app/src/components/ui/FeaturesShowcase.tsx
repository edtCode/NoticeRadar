import { BellRing, Newspaper, Sparkles, Target, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { Marquee } from './Marquee';

export interface ShowcaseFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * The questions Oppora exists to answer, running as three ticker rows.
 * They are notice-shaped, not marketing-shaped — the marquee is the product
 * saying what it removes from a student's day.
 */
const NOTICE_QUESTIONS = [
  "Where do I find the latest placement notices?",
  "Did the exam timetable change?",
  "What's due this week?",
  "Which notices apply to my branch?",
  "Where's the original PDF?",
  'Am I eligible for this scholarship?',
  "What's the minimum CPI?",
  'Are backlogs allowed?',
  'Which documents do I need?',
  'Can I still apply for this internship?',
  'When does the application close?',
  'Who do I contact for this?',
  'Is this notice verified?',
  'When is the placement drive?',
  'What did the circular actually say?',
];

const FEATURES: ShowcaseFeature[] = [
  {
    icon: Newspaper,
    title: 'Everything in one place',
    description:
      'All official notices from your institution live in one searchable feed, with filters, saved items, and direct access to the original documents.',
  },
  {
    icon: Sparkles,
    title: 'We read the fine print',
    description:
      'Oppora extracts deadlines, eligibility requirements, documents, and key fields from uploaded PDFs while showing the source evidence behind each result.',
  },
  {
    icon: Target,
    title: 'Only what applies to you',
    description:
      'Your academic profile powers a tailored notice stream with transparent verdicts, reasons, and clear signals for missing information.',
  },
  {
    icon: BellRing,
    title: 'Never miss a deadline',
    description:
      'Automatic reminders keep students on track, while administrators review every notice against the source PDF before it is published.',
  },
];

export interface FeaturesShowcaseProps {
  questions?: string[];
  features?: ShowcaseFeature[];
  className?: string;
  /** Page-level pages use h1; embedded sections use h2. */
  headingLevel?: 1 | 2;
}

export function FeaturesShowcase({
  questions = NOTICE_QUESTIONS,
  features = FEATURES,
  className,
  headingLevel = 1,
}: FeaturesShowcaseProps) {
  // Deal the questions into three rows so no row repeats a theme
  const rows = [0, 1, 2].map((row) => questions.filter((_, index) => index % 3 === row));
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <section className={cn('relative', className)} aria-labelledby="features-showcase-title">
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <header className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-caption font-semibold text-accent">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            Features
          </span>

          <Heading
            id="features-showcase-title"
            className="max-w-3xl text-balance text-[clamp(2.5rem,5.5vw,4.25rem)] font-semibold leading-[1.04] tracking-tight text-text"
          >
            Removing the{' '}
            <span className="marker-loud marker-stamp text-loud-ink">noise</span> from your notice feed
          </Heading>

          <p className="max-w-xl text-pretty text-body leading-relaxed text-text-muted md:text-lg">
            It&apos;s easy to get lost in a sea of circulars, conflicting deadlines, and endless
            &ldquo;must-reads.&rdquo; We filter out what doesn&apos;t apply to you, surface what
            does, and give you the kind of clarity that lets you act on the right notice at the
            right time.
          </p>
        </header>
      </div>

      {/* Three ticker rows — the questions students actually ask */}
      <div className="mt-10 overflow-hidden sm:mt-14">
        <Marquee fade duration="56s" gap="0.75rem" repeat={4}>
          {rows[0].map((question) => (
            <span key={question} className="showcase-chip">
              {question}
            </span>
          ))}
        </Marquee>
        <Marquee fade reverse duration="68s" gap="0.75rem" className="mt-3" repeat={4}>
          {rows[1].map((question) => (
            <span key={question} className="showcase-chip">
              {question}
            </span>
          ))}
        </Marquee>
        <Marquee fade duration="50s" gap="0.75rem" className="mt-3" repeat={4}>
          {rows[2].map((question) => (
            <span key={question} className="showcase-chip">
              {question}
            </span>
          ))}
        </Marquee>
      </div>

      {/* Capability grid — dashed rules, no card chrome, type carries the hierarchy */}
      <div className="mx-auto mt-16 w-full max-w-[1400px] sm:mt-20">
        <div className="grid grid-cols-1 border-t border-dashed border-border-strong sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const total = features.length;
            return (
              <div
                key={feature.title}
                className={cn(
                  'group flex flex-col gap-5 border-dashed border-border-strong px-5 py-9 transition-colors hover:bg-bg-elevated/50 sm:px-6 lg:px-8 lg:py-10',
                  // 1 col: rule between rows · 2 cols: rule between rows · 4 cols: no row rules
                  index < total - 1 && 'border-b',
                  index < total - 2 && 'sm:border-b',
                  index >= total - 2 && 'sm:border-b-0',
                  'lg:border-b-0',
                  // 2 cols: rule before the right cell · 4 cols: rule before every cell after the first
                  index % 2 === 1 && 'sm:border-l',
                  index > 0 && 'lg:border-l'
                )}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.25}
                  className="size-12 shrink-0 text-text transition-colors duration-200 group-hover:text-accent"
                />

                <div className="flex flex-col gap-2.5 pt-8 lg:pt-20">
                  <h2 className="text-2xl font-semibold leading-tight tracking-tight text-text sm:text-3xl">
                    {feature.title}
                  </h2>
                  <p className="text-pretty text-body leading-relaxed text-text-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export { NOTICE_QUESTIONS, FEATURES };
