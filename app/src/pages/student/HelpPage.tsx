import { Link } from 'react-router-dom';
import { SectionHeader } from '../../components/common/PageHeader';
import { HelpCircle, ChevronRight, Mail } from 'lucide-react';

const FAQS = [
  {
    q: 'How does NoticeRadar decide "what applies to me"?',
    a: 'Your dashboard feed uses rules over your academic profile — branch, current semester, CPI, graduation year and active backlogs — matched against the requirements each notice declares. Every notice shows which requirements matched, which did not, and which fields were missing. It is a transparent rule engine, not a hidden score.',
  },
  {
    q: 'What does "Possibly Eligible" mean?',
    a: 'It means part of the information needed is missing or ambiguous — for example, your profile is incomplete, or the notice lacks a clear eligibility statement. Update your profile to sharpen the result.',
  },
  {
    q: 'How do the AI summaries work?',
    a: 'When an administrator uploads an official PDF, NoticeRadar extracts its text and asks the configured AI provider to pull out structured fields: deadlines, eligibility criteria, documents and more. The summary beside each notice comes from that extraction — always verify important details against the original notice.',
  },
  {
    q: 'How do deadline reminders work?',
    a: 'The system checks deadlines automatically and sends in-app reminders 7 days, 3 days and 1 day before a deadline, to students who are eligible or possibly eligible for that notice. No setup is needed, and reminders are not sent for expired deadlines.',
  },
  {
    q: 'How do I save a notice?',
    a: 'Use the bookmark button on any notice card or the notice details page. Saved notices appear under Saved Notices, searchable and sorted so you can revisit them.',
  },
  {
    q: 'Who do I contact about something that looks wrong?',
    a: 'Your institution\'s administrators are responsible for notice content — use the contact channel your institution has provided. NoticeRadar ensures every notice keeps a link back to the original PDF so you can always check the source.',
  },
  {
    q: 'Why can\'t I see a notice my friend can see?',
    a: 'Notices are published per institution. You only see notices published by your institution, in your language of eligibility: everything visible, verdicts included.',
  },
];

const TOPICS: Array<{ title: string; body: string }> = [
  {
    title: 'Getting started',
    body: 'Register, verify your email, complete the four-step profile setup (institution, academics, interests), and your dashboard fills with notices from your institution.',
  },
  {
    title: 'How eligibility matching works',
    body: 'NoticeRadar compares the requirements a notice declares — eligible branches, minimum CPI, semester range, graduation years, backlog requirement — against your profile. Results are Eligible, Not Eligible, or Possibly Eligible, each with reasons and missing fields. Final eligibility always rests with the recruiting organisation or issuing authority.',
  },
  {
    title: 'Saving notices',
    body: 'Bookmarked notices are collected under Saved Notices, searchable at any time. Saving does not affect reminders: eligible deadlines are reminded regardless of saved state.',
  },
  {
    title: 'Deadline reminders',
    body: 'Automatic in-app reminders arrive at 7, 3 and 1 days before each deadline, for notices you are eligible or possibly eligible for. Reminders come from the system scheduler and cannot currently be customised.',
  },
  {
    title: 'Why an eligibility result may be uncertain',
    body: 'A result is "Possibly Eligible" when it lacks information — from your profile or from the notice. Filling your profile completely reduces uncertainty; the notice itself can only be clarified by its publisher.',
  },
  {
    title: 'Contacting your institution',
    body: 'NoticeRadar carries official notices; administrative questions about a programme, a delay or a correction go to the department or office that issued it. Every notice links back to the original document portal it came from.',
  },
];

export function HelpPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="text-h1 font-semibold text-text">Help & Support</h1>
        <p className="text-body text-text-muted mt-1">How NoticeRadar works, and how to get help from your institution.</p>
      </header>

      <section aria-labelledby="topics-heading">
        <SectionHeader title="Topics" />
        <div className="grid sm:grid-cols-2 gap-4" id="topics-heading">
          {TOPICS.map((t) => (
            <article key={t.title} className="bg-bg-elevated border border-border rounded-lg p-5">
              <h3 className="text-h4 font-semibold text-text mb-2">{t.title}</h3>
              <p className="text-body-sm text-text-muted">{t.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq-heading">
        <SectionHeader title="Frequently asked questions" />
        <div className="bg-bg-elevated border border-border rounded-lg divide-y divide-border" id="faq-heading">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex items-center justify-between gap-3 cursor-pointer text-body font-medium text-text outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm" aria-label={f.q}>
                {f.q}
                <ChevronRight className="w-4 h-4 text-text-muted transition-transform group-open:rotate-90 flex-shrink-0" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-body-sm text-text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-accent-soft border border-accent rounded-lg p-6">
        <div className="flex items-start gap-4">
          <HelpCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-h4 font-semibold text-text mb-1">Still need help?</h2>
            <p className="text-body-sm text-text-muted mb-3">
              For account or notice content questions, reach out through your institution's official support channel. Support tickets inside NoticeRadar are not available yet.
            </p>
            <Link to="/student/dashboard" className="text-body-sm font-medium text-accent hover:underline">Back to dashboard</Link>
          </div>
        </div>
      </section>
    </div>
  );
}