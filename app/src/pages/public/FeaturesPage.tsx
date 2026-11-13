import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { FeaturesShowcase } from '../../components/ui/FeaturesShowcase';

const NOT_OPPORA = [
  'It does not crawl college websites or auto-detect new notices — administrators publish verified ones.',
  'It does not offer semantic or conversational search — search matches words in the notice database.',
  'It does not decide your eligibility — it evaluates published rules against your profile and shows its reasoning.',
  'It never replaces the official notice — every screen links back to the original PDF.',
];

export function FeaturesPage() {
  return (
    <div className="flex flex-col">
      <FeaturesShowcase />

      {/* Honesty box — what the product deliberately does not do */}
      <section
        aria-labelledby="not-oppora-title"
        className="mx-auto w-full max-w-3xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8"
      >
        <div className="card-signal p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-bg text-accent">
              <ShieldCheck className="size-5" aria-hidden="true" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-mono text-caption uppercase tracking-widest text-text-muted">
                The honest part
              </p>
              <h2 id="not-oppora-title" className="text-h3 font-semibold text-text">
                What Oppora is not
              </h2>
            </div>
          </div>

          <ul className="space-y-3">
            {NOT_OPPORA.map((item) => (
              <li key={item} className="flex gap-3 text-body-sm leading-relaxed text-text-muted">
                <span
                  className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 text-center">
          <Link to="/register" className="btn-primary btn-lg inline-flex">
            Create Your Free Account
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-caption text-text-muted">
            No credit card. Your profile takes about two minutes.
          </p>
        </div>
      </section>
    </div>
  );
}
