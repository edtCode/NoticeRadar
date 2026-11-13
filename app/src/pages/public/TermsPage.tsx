import {
  LegalCallout,
  LegalContactCard,
  LegalFacts,
  LegalLink,
  LegalList,
  LegalPage,
  LegalParagraph,
  LegalSubheading,
  type LegalSection,
} from '../../components/legal';
import { LEGAL_CONTACT_EMAIL } from '../../constants';

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of these terms',
    content: (
      <>
        <LegalParagraph>
          These Terms of Service govern your access to and use of Oppora, including this website, the
          Oppora API that serves it, and any optional integration with a Gmail account. By creating an
          account, signing in, or otherwise using the service, you agree to these Terms and to our{' '}
          <LegalLink href="/privacy-policy">Privacy Policy</LegalLink>.
        </LegalParagraph>
        <LegalParagraph>
          If you do not agree to these Terms, do not use Oppora. If you are using Oppora on behalf of
          an institution, you confirm that you are authorised to accept these Terms for that
          institution.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'the-service',
    title: 'What Oppora is',
    content: (
      <>
        <LegalParagraph>
          Oppora is a notice-intelligence service for higher-education institutions. It provides:
        </LegalParagraph>
        <LegalList>
          <li>
            A personalised feed of official notices that institution administrators upload, review and
            publish.
          </li>
          <li>
            AI-assisted summaries and structured fields extracted from those notices, shown alongside
            the source document.
          </li>
          <li>
            A rule-based eligibility assessment that compares published requirements against the
            academic profile you provide, together with its reasoning.
          </li>
          <li>Saved notices, deadline tracking and in-app reminders.</li>
          <li>
            An optional Gmail integration that reads messages from a mailbox you authorise and extracts
            student-relevant announcements from them.
          </li>
        </LegalList>
        <LegalParagraph>
          Oppora is not a recruitment platform, an application system, or a party to any opportunity it
          surfaces. It does not submit applications, contact organisations on your behalf, or
          guarantee that any opportunity exists, is still open or is accurately described in a source
          email.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account and responsibilities',
    content: (
      <>
        <LegalParagraph>
          You must provide accurate information when you register and keep it current — particularly
          your institution and academic profile, because eligibility results depend on them.
        </LegalParagraph>
        <LegalList>
          <li>
            Keep your login credentials confidential. You are responsible for activity carried out
            through your account.
          </li>
          <li>
            Do not share your account, or use another person's account, without permission.
          </li>
          <li>
            Notify us promptly at{' '}
            <LegalLink href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</LegalLink> if you
            believe your account has been compromised.
          </li>
          <li>
            You must have the legal capacity to enter into these Terms and to use the service lawfully
            in your jurisdiction.
          </li>
        </LegalList>
        <LegalParagraph>
          We may suspend or terminate accounts that contain false information, that are used to
          circumvent access controls, or that otherwise breach these Terms.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'gmail-integration',
    title: 'Google account and Gmail integration',
    content: (
      <>
        <LegalParagraph>
          The Gmail integration is optional and requires your explicit consent through Google's OAuth
          flow. By connecting an account, you authorise Oppora to read messages from that mailbox using
          the permissions you grant, so that it can extract announcements and display them in your
          account.
        </LegalParagraph>
        <LegalFacts
          items={[
            {
              label: 'What Oppora does',
              value:
                'Reads message metadata, body text and links from messages within the sync window, and processes that content with an AI model to produce structured announcements.',
            },
            {
              label: 'What Oppora does not do',
              value:
                'It does not send email on your behalf, delete messages, modify labels or message state, or use those credentials for any Google service beyond reading Gmail and confirming which Google account was connected.',
            },
            {
              label: 'Your responsibility',
              value:
                'You confirm that you are authorised to grant access to the mailbox you connect. Do not connect a mailbox that belongs to someone else without their permission.',
            },
          ]}
        />
        <LegalParagraph>
          You can disconnect at any time from the Gmail Connect page, and you can revoke Oppora's
          access from your Google Account permissions. Your use of Gmail remains subject to Google's
          own terms. Oppora's handling of Gmail data is described in the Privacy Policy and follows the
          Google API Services User Data Policy, including its Limited Use requirements.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    content: (
      <>
        <LegalParagraph>You agree not to:</LegalParagraph>
        <LegalList>
          <li>Use Oppora for any unlawful purpose or in breach of applicable law.</li>
          <li>
            Attempt to access another user's account, profile, Gmail connection, announcements or
            notifications.
          </li>
          <li>
            Probe, scan or test the security of the service, or attempt to bypass authentication,
            authorisation or row-level security.
          </li>
          <li>
            Scrape, crawl or bulk-download data from the service, or use automated means to place
            excessive load on it.
          </li>
          <li>
            Reverse engineer, decompile or attempt to extract the source code of the service, except
            where that restriction is prohibited by law.
          </li>
          <li>
            Interfere with the AI pipeline — for example by crafting emails or content intended to
            manipulate extraction, inject instructions into the model, or cause it to emit
            unauthorised output.
          </li>
          <li>
            Upload or process content that infringes intellectual property, contains malware, or
            violates the rights of others.
          </li>
          <li>Resell, sublicense or provide the service to third parties as your own.</li>
        </LegalList>
        <LegalParagraph>
          We may investigate suspected breaches and restrict access while an investigation is ongoing.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'ai-limitations',
    title: 'AI-generated content and its limitations',
    content: (
      <>
        <LegalCallout title="AI output can be wrong" icon={<span aria-hidden="true">!</span>}>
          <p>
            Announcement extraction and summaries are generated by an AI model from email content and
            notice documents. They are probabilistic, can miss information, can misread dates or
            numbers, and can produce fields that do not reflect the source. They are not a substitute
            for reading the original message or official notice.
          </p>
        </LegalCallout>
        <LegalParagraph>
          Oppora applies validation, confidence scoring and review flags to reduce errors: values that
          are missing stay missing rather than being invented, event dates are kept separate from
          application deadlines, CPI, CGPA and percentage are not converted into one another, and
          contradictory statements are flagged for review. These safeguards reduce risk; they do not
          eliminate it.
        </LegalParagraph>
        <LegalParagraph>
          AI output and eligibility results are informational only. They are not legal, financial,
          academic or career advice, and they are not a decision by any institution, employer or
          scholarship provider.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'verification',
    title: 'You must verify important information',
    content: (
      <>
        <LegalParagraph>
          You are responsible for confirming every deadline, eligibility requirement, document,
          application link and event detail against the official source before acting on it.
        </LegalParagraph>
        <LegalList>
          <li>
            Where Oppora links to an original notice, PDF or application page, that source is the
            authority — not the extracted summary.
          </li>
          <li>
            Eligibility verdicts are computed from the rules stated in a notice and the profile you
            supplied. A missing or outdated profile value can change the result.
          </li>
          <li>
            The organisation running an opportunity makes all decisions about eligibility, selection
            and deadlines.
          </li>
          <li>
            Oppora is not responsible for opportunities you miss, applications you submit incorrectly,
            or losses arising from reliance on AI-generated or extracted information.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and technical limitations',
    content: (
      <>
        <LegalParagraph>
          Oppora is provided on an "as available" basis. We do not offer a service-level agreement or
          guarantee that the service will be uninterrupted, timely, secure or error-free.
        </LegalParagraph>
        <LegalParagraph>You should be aware of these limits in particular:</LegalParagraph>
        <LegalList>
          <li>
            Gmail sync is not real time. It runs in bounded batches, may be delayed, and background
            syncing can be disabled by the operator at any time.
          </li>
          <li>
            A newly connected mailbox begins from a Gmail history checkpoint; older messages are only
            processed if a full sync is run, and full syncs are bounded.
          </li>
          <li>
            AI extraction can fail, time out or be rate-limited. Failed messages are recorded as failed
            and do not produce announcements.
          </li>
          <li>
            The service depends on third-party providers (Google, Supabase, Render, Vercel, Resend).
            Their outages, policy changes or API changes can interrupt Oppora.
          </li>
          <li>
            Notices and announcements may be edited, corrected, archived or withdrawn after you first
            see them.
          </li>
        </LegalList>
        <LegalParagraph>
          We may modify, suspend or discontinue any part of the service, including features in beta,
          without liability, though we will try to give reasonable notice of material changes.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party services and links',
    content: (
      <>
        <LegalParagraph>
          Oppora relies on third-party services to operate, including Google (Gmail and Gemini),
          Supabase, Render, Vercel and Resend. Your use of those services may be subject to their own
          terms and privacy policies.
        </LegalParagraph>
        <LegalParagraph>
          Notices and announcements may link to websites, application portals or documents operated by
          other organisations. We do not control those destinations and are not responsible for their
          content, availability, security or data practices. Following an external link is at your own
          risk.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    content: (
      <>
        <LegalParagraph>
          The Oppora name, logo, interface, software and documentation are owned by Oppora or its
          licensors and are protected by applicable intellectual property laws. These Terms do not
          grant you any right to use them except as necessary to use the service.
        </LegalParagraph>
        <LegalParagraph>
          You retain ownership of the information you provide, including your profile details and any
          personal entries you create. You grant Oppora a limited licence to store, process and display
          that information solely to operate the service for you — including sending email content to
          our AI provider to extract announcements when you connect Gmail.
        </LegalParagraph>
        <LegalParagraph>
          Official notices, PDFs and their contents belong to the institutions and organisations that
          issued them. Oppora displays them for informational purposes and does not claim ownership.
        </LegalParagraph>
        <LegalParagraph>
          If you send us feedback or suggestions, you permit us to use them without obligation to you.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension and termination',
    content: (
      <>
        <LegalParagraph>
          You may stop using Oppora at any time and may request deletion of your account by emailing{' '}
          <LegalLink href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</LegalLink>.
        </LegalParagraph>
        <LegalParagraph>
          We may suspend or terminate your access, with or without notice, if:
        </LegalParagraph>
        <LegalList>
          <li>You breach these Terms or the acceptable-use policy.</li>
          <li>We are required to do so by law or by a provider's policy.</li>
          <li>
            Your use presents a security risk, places an unreasonable load on the service, or harms
            other users or the service.
          </li>
          <li>The service is discontinued.</li>
        </LegalList>
        <LegalParagraph>
          On termination, your right to use the service ends. Data associated with your account is
          handled as described in the Privacy Policy. Provisions that by their nature should survive
          termination — including intellectual property, disclaimers and limitation of liability —
          continue to apply.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Disclaimers and limitation of liability',
    content: (
      <>
        <LegalParagraph>
          To the maximum extent permitted by law, Oppora is provided "as is" and "as available",
          without warranties of any kind, express or implied, including warranties of merchantability,
          fitness for a particular purpose, accuracy and non-infringement.
        </LegalParagraph>
        <LegalParagraph>
          To the maximum extent permitted by law, Oppora and its operators will not be liable for any
          indirect, incidental, special, consequential or punitive damages, or for any loss of
          opportunity, profits, data, goodwill or reputation, arising out of or relating to your use of
          the service — including missed deadlines, ineligible or rejected applications, inaccurate AI
          extraction, unavailable syncing, or interruptions caused by third-party providers.
        </LegalParagraph>
        <LegalParagraph>
          Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or
          limited, including liability for fraud or for death or personal injury caused by negligence.
        </LegalParagraph>
        <LegalParagraph>
          You are responsible for maintaining your own records of deadlines and application details
          that matter to you.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    content: (
      <>
        <LegalParagraph>
          We may update these Terms as the service evolves. The revised version will be published on
          this page with a new "last updated" date. Where a change materially affects your rights or
          obligations, we will provide reasonable notice in the application or by email before it takes
          effect.
        </LegalParagraph>
        <LegalParagraph>
          Continuing to use Oppora after the effective date of a revised version means you accept the
          updated Terms. If you do not agree, you should stop using the service and may request deletion
          of your account.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <LegalParagraph>
          Questions about these Terms, or notices relating to your account, can be sent to the address
          below.
        </LegalParagraph>
        <LegalContactCard>
          For questions about these Terms, account issues, or legal notices, email us. Include the
          email address associated with your Oppora account where relevant.
        </LegalContactCard>
      </>
    ),
  },
];

export function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          The agreement between you and Oppora: what the service does, what it does not do, how the
          Gmail integration works, and the limits you should rely on.
        </p>
      }
      sections={SECTIONS}
    />
  );
}