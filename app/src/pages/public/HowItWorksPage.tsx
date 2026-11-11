import { Link } from 'react-router-dom';
import { ArrowRight, UserPlus, Upload, Zap, ShieldCheck, Target, Clock } from 'lucide-react';

const STEPS = [
  {
    icon: UserPlus,
    step: 1,
    title: 'Register and complete your academic profile',
    description: 'Students create an account and fill in their institution, department, branch, current semester, CPI, graduation year, active backlogs and what kinds of opportunities they care about. This profile powers everything that follows.',
    actor: 'Student',
  },
  {
    icon: Upload,
    step: 2,
    title: 'Administrators upload official college notices',
    description: 'Institution staff upload the original PDF — a placement newsletter, scholarship circular, exam timetable or event announcement — along with basic information.',
    actor: 'Administrator',
  },
  {
    icon: Zap,
    step: 3,
    title: 'NoticeRadar extracts and structures relevant information',
    description: 'The PDF is read page by page, and the configured AI provider extracts titles, categories, deadlines, eligibility criteria, required documents and application links — every field with its supporting quote and page number.',
    actor: 'System',
  },
  {
    icon: ShieldCheck,
    step: 4,
    title: 'Administrators verify and approve the extracted information',
    description: 'In the review workspace, extracted fields sit side by side with the original PDF and the evidence quotes behind them. Administrators correct anything wrong, approve, and only then publish.',
    actor: 'Administrator',
  },
  {
    icon: Target,
    step: 5,
    title: 'Students discover relevant notices and track upcoming deadlines',
    description: 'The personalised feed shows each notice with a transparent eligibility verdict and reasons. Saved opportunities get automatic reminders at 7, 3 and 1 day before their deadline.',
    actor: 'Student',
  },
];

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <header className="text-center mb-16">
        <h1 className="text-display font-semibold text-text mb-4">How NoticeRadar Works</h1>
        <p className="text-body text-text-muted">
          One verified pipeline: official PDF in, trusted personalised notice out. A human approves everything before students see it.
        </p>
      </header>

      <ol className="space-y-10">
        {STEPS.map((step) => (
          <li key={step.step} className="flex gap-5">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-accent text-text-inverted rounded-full flex items-center justify-center font-semibold" aria-hidden="true">
                {step.step}
              </div>
              {step.step < STEPS.length && (
                <div className="mx-auto w-px h-8 bg-border mt-2" aria-hidden="true" />
              )}
            </div>
            <div className="pt-1.5">
              <span className="inline-block px-2 py-0.5 rounded-full bg-accent text-loud-ink text-caption font-medium mb-2">
                {step.actor}
              </span>
              <h2 className="text-h3 font-semibold text-text mb-2">{step.title}</h2>
              <p className="text-body text-text-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Reminder explainer */}
      <section className="mt-16 p-6 bg-bg-elevated border border-border rounded-lg">
        <h2 className="text-h4 font-semibold text-text mb-3">Deadline reminders arrive automatically</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {['7 days before', '3 days before', '1 day before'].map((r) => (
            <div key={r} className="flex-1 p-4 bg-bg border border-border rounded-md text-center">
              <Clock aria-hidden="true" className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-body-sm font-medium text-text">{r}</p>
            </div>
          ))}
        </div>
        <p className="text-body-sm text-text-muted mt-4">
          Reminders are generated for eligible and possibly-eligible students only, and never for deadlines that have already passed.
        </p>
      </section>

      <div className="text-center mt-16">
        <Link to="/register" className="btn-primary btn-lg inline-flex">
          Create Your Free Account
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}