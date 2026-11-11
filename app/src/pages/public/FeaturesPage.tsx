import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Zap, Target, Clock } from 'lucide-react';
import { FeatureCard } from '../../components/ui';

const FEATURES = [
  {
    icon: FileText,
    title: 'Centralised Notice Feed',
    description: 'All official notices from your institution live in one searchable feed, with filters, saved items, and direct access to the original documents.',
  },
  {
    icon: Zap,
    title: 'AI Extraction & Summaries',
    description: 'NoticeRadar extracts deadlines, eligibility requirements, documents, and key fields from uploaded PDFs while showing the source evidence behind each result.',
  },
  {
    icon: Target,
    title: 'Personalised Eligibility Matching',
    description: 'Your academic profile powers a tailored notice stream with transparent verdicts, reasons, and clear signals for missing information.',
  },
  {
    icon: Clock,
    title: 'Reminders & Verified Publishing',
    description: 'Automatic reminders keep students on track, while administrators review every notice against the source PDF before it is published.',
  },
];


export function FeaturesPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <header className="text-center mb-16">
        <h1 className="text-display font-semibold text-text mb-4">What NoticeRadar Does</h1>
        <p className="text-body text-text-muted max-w-2xl mx-auto">
          Every capability listed here is implemented — end to end, from the uploaded PDF to the personalised feed on your dashboard.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {FEATURES.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            color={index % 2 === 0 ? 'lime' : 'sand'}
            index={index}
            total={FEATURES.length}
          />
        ))}
      </div>

      {/* Honesty box */}
      <section className="mt-16 p-6 bg-bg border border-border rounded-lg max-w-3xl mx-auto">
        <h2 className="text-h4 font-semibold text-text mb-2">What NoticeRadar is not</h2>
        <ul className="space-y-2 text-body-sm text-text-muted list-disc list-inside">
          <li>It does not crawl college websites or auto-detect new notices — administrators publish verified ones.</li>
          <li>It does not offer semantic or conversational search — search matches words in the notice database.</li>
          <li>It does not decide your eligibility — it evaluates published rules against your profile and shows its reasoning.</li>
          <li>It never replaces the official notice — every screen links back to the original PDF.</li>
        </ul>
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