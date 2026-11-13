import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ChevronDown, Link2, Mail, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { APP_NAME, LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED, ROUTES } from '../../constants';

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

// ---------------------------------------------------------------------------
// Scroll spy — highlights the section currently under the reading line.
// ---------------------------------------------------------------------------

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join('|');

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) {
      return;
    }

    // A scroll-position check rather than an IntersectionObserver: sections
    // are contiguous, so at any scroll position the previous section's tail
    // can still intersect a narrow observer band and win the "topmost" race.
    // Walking the list against one reading line gives a stable answer, both
    // for normal scrolling and for direct hash jumps.
    const READING_LINE = 140;
    let frame = 0;

    const update = () => {
      frame = 0;

      let current = elements[0].id;

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= READING_LINE) {
          current = element.id;
        } else {
          break;
        }
      }

      setActive((previous) => (previous === current ? previous : current));
    };

    const schedule = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
    // `key` is the stable representation of `ids`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
}

// ---------------------------------------------------------------------------
// Table of contents
// ---------------------------------------------------------------------------

function TableOfContents({
  sections,
  active,
  className,
  showLabel = true,
}: {
  sections: LegalSection[];
  active: string;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <nav aria-label="On this page" className={className}>
      {showLabel && <p className="mb-3 text-caption font-semibold text-text">On this page</p>}
      <ul className="border-l border-border">
        {sections.map((section) => {
          const isActive = section.id === active;

          return (
            <li key={section.id} className="relative">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'block py-1.5 pl-4 pr-2 text-body-sm leading-snug transition-colors duration-fast',
                  isActive ? 'text-text' : 'text-text-muted hover:text-text'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 top-2.5 h-2 w-2 -translate-x-1/2 rounded-full bg-accent transition-transform duration-fast',
                    isActive ? 'scale-100' : 'scale-0'
                  )}
                />
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileTableOfContents({ sections, active }: { sections: LegalSection[]; active: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <details
      ref={detailsRef}
      className="group mb-10 rounded-lg border border-border bg-bg-elevated lg:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-body-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg [&::-webkit-details-marker]:hidden">
        On this page
        <ChevronDown className="h-4 w-4 text-text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div
        className="border-t border-border px-4 py-3"
        onClick={(event) => {
          // Collapse after a jump so the target section is visible straight away.
          if ((event.target as HTMLElement).closest('a') && detailsRef.current) {
            detailsRef.current.open = false;
          }
        }}
      >
        <TableOfContents sections={sections} active={active} showLabel={false} />
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Content primitives
// ---------------------------------------------------------------------------

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className="text-body leading-7 text-text-muted">{children}</p>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-body leading-7 text-text-muted marker:text-border-strong">
      {children}
    </ul>
  );
}

export function LegalSubheading({ children }: { children: ReactNode }) {
  return <h3 className="pt-3 text-h4 font-semibold tracking-[-0.01em] text-text">{children}</h3>;
}

export function LegalLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    'font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export function LegalFacts({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-bg-elevated">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="text-body-sm font-semibold text-text">{item.label}</dt>
          <dd className="text-body-sm leading-6 text-text-muted">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LegalCallout({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-5">
      <p className="flex items-center gap-2 text-body-sm font-semibold text-text">
        <span className="text-accent" aria-hidden="true">
          {icon ?? <ShieldCheck className="h-4 w-4" />}
        </span>
        {title}
      </p>
      <div className="mt-2 text-body-sm leading-6 text-text-muted">{children}</div>
    </div>
  );
}

export function LegalContactCard({ children }: { children: ReactNode }) {
  return (
    <div className="card-signal p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-loud-ink">
          <Mail className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-h4 font-semibold text-text">Contact {APP_NAME}</p>
          <p className="mt-1 text-body-sm leading-6 text-text-muted">{children}</p>
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="mt-3 inline-flex break-all text-body-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

type LegalPageProps = {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
};

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  const ids = sections.map((section) => section.id);
  const active = useActiveSection(ids);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} — ${APP_NAME}`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  // Content mounts after the browser has already tried to resolve the URL
  // fragment, so a direct link like /privacy-policy#gmail would otherwise open
  // at the top of the page. Jump to the requested section once it exists.
  useEffect(() => {
    const hash = window.location.hash.slice(1);

    if (!hash) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash))?.scrollIntoView();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div id="top" className="mx-auto max-w-[1200px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <Link
        to={ROUTES.HOME}
        className="group inline-flex items-center gap-2 text-body-sm font-medium text-text-muted transition-colors hover:text-text"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border transition-colors group-hover:border-border-strong group-hover:bg-bg-hover">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        Back to home
      </Link>

      <header className="mt-8 max-w-[75ch] animate-slide-up">
        <h1 className="text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.035em] text-text">
          {title}
        </h1>
        <div className="mt-5 max-w-[68ch] space-y-3 text-body leading-7 text-text-muted">{intro}</div>
        <p className="mt-6 inline-flex items-center gap-2 text-caption text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          Last updated {LEGAL_LAST_UPDATED}
        </p>
      </header>

      <div className="mt-10 h-px w-full bg-border" aria-hidden="true" />

      <div className="mt-10 lg:mt-14 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 xl:gap-24">
        <aside className="hidden lg:block">
          <div className="scrollbar-thin sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <TableOfContents sections={sections} active={active} />
          </div>
        </aside>

        <div className="min-w-0">
          <MobileTableOfContents sections={sections} active={active} />

          <article className="max-w-[72ch]">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 border-t border-border pb-10 pt-10 first:border-t-0 first:pt-0 last:pb-0"
              >
                <h2 className="group flex items-start gap-1 text-h2 font-semibold tracking-[-0.02em] text-text">
                  <span className="text-balance">{section.title}</span>
                  <a
                    href={`#${section.id}`}
                    aria-label={`Link to ${section.title}`}
                    className="mt-1.5 rounded-sm p-1 text-text-muted opacity-0 transition-opacity hover:text-text focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                  </a>
                </h2>
                <div className="mt-4 space-y-4">{section.content}</div>
              </section>
            ))}
          </article>

          <div className="mt-12 flex justify-end border-t border-border pt-6">
            <a
              href="#top"
              className="inline-flex items-center gap-2 text-body-sm font-medium text-text-muted transition-colors hover:text-text"
            >
              Back to top
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}