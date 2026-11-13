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
    id: 'overview',
    title: 'Overview',
    content: (
      <>
        <LegalParagraph>
          Oppora is a web application that helps students at higher-education institutions find,
          understand and track official notices published by their institution. If you choose to
          connect a Gmail account, Oppora can also read student-relevant announcements — internships,
          placements, hackathons, events, scholarships and similar opportunities — from messages in
          that mailbox and turn them into structured records inside your account.
        </LegalParagraph>
        <LegalParagraph>
          This policy explains what personal data Oppora collects, why it is collected, where it is
          stored, which third-party services process it, and the choices available to you. It applies
          to this website and the API that serves it. Oppora is the controller of the personal data
          described here.
        </LegalParagraph>
        <LegalParagraph>
          Connecting Gmail is entirely optional. The notice feed, your academic profile, saved
          notices and deadline reminders all work without granting access to any mailbox.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    content: (
      <>
        <LegalParagraph>
          We collect only the information needed to run the service. The categories below reflect
          what the current version of Oppora actually stores.
        </LegalParagraph>
        <LegalFacts
          items={[
            {
              label: 'Account',
              value:
                'Your name, email address, account role (student or administrator), institution association, and authentication records managed by Supabase Auth. Passwords are submitted directly to Supabase Auth, which stores them in hashed form; Oppora never receives or stores your plain-text password.',
            },
            {
              label: 'Academic profile',
              value:
                'Institution, department, branch, current semester, CPI on a 0–10 scale, graduation year, number of active backlogs, and the opportunity interests you select. You provide these during onboarding and can change them later.',
            },
            {
              label: 'Activity',
              value:
                'Notices you save, bookmarks and dismissals, read state for email announcements, and the in-app notification records created for you.',
            },
            {
              label: 'Gmail connection (optional)',
              value:
                'The Google account identifier and Gmail address you connect, encrypted OAuth access and refresh tokens, token expiry, the scopes you granted, a Gmail history cursor used for incremental sync, and records of which messages have been processed.',
            },
            {
              label: 'Extracted announcements',
              value:
                'Structured announcement records produced from your Gmail messages, including organisation names, roles, dates, eligibility criteria, links and contact details, together with confidence and review flags.',
            },
            {
              label: 'Technical information',
              value:
                'When you use the service, our hosting and database providers process standard request data such as IP address, browser and device information, timestamps and error diagnostics. Oppora does not run third-party advertising or behavioural analytics trackers.',
            },
          ]}
        />
        <LegalParagraph>
          Oppora is not a "Sign in with Google" product. Google OAuth is used only when you choose to
          connect a Gmail account from inside your Oppora account. We never ask for or store your
          Google password.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'academic-profile',
    title: 'Your academic profile',
    content: (
      <>
        <LegalParagraph>
          Your academic profile is the lens Oppora uses to evaluate whether a published notice
          applies to you. The eligibility engine compares the requirements declared in a notice —
          eligible branches or departments, semester range, minimum CPI, CGPA or percentage,
          graduation years and backlog requirements — against the values in your profile.
        </LegalParagraph>
        <LegalParagraph>
          Profile data is stored in our Supabase database and protected by row-level security, so
          other students cannot read it. Oppora's server-side code uses a privileged service-role key
          for background jobs such as scheduling reminders; that key is held only in the server
          environment and is never exposed to the browser.
        </LegalParagraph>
        <LegalParagraph>
          Eligibility results are informational. They are not an admission, recruitment or
          scholarship decision, and the issuing organisation always makes the final assessment.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'gmail',
    title: 'Gmail access and Google user data',
    content: (
      <>
        <LegalParagraph>
          When you connect Gmail, Oppora uses Google OAuth 2.0 and requests the following permissions:
        </LegalParagraph>
        <LegalFacts
          items={[
            {
              label: 'gmail.readonly',
              value: 'Read your Gmail messages and their metadata.',
            },
            {
              label: 'gmail.modify',
              value:
                'A broader permission that also covers labels and message state. Oppora\'s current code only reads messages; it does not use this scope to change labels, send mail or delete anything.',
            },
          ]}
        />
        <LegalParagraph>
          From the messages it processes, Oppora reads the subject, sender, date, message and thread
          identifiers, Gmail labels, the plain-text body (or an HTML body converted to text), the
          Gmail snippet, and any links contained in the body. Attachments are not downloaded or
          stored. Oppora does not send email on your behalf, does not delete messages, and does not
          modify labels or message state.
        </LegalParagraph>
        <LegalParagraph>
          Sync is bounded in normal operation. The app requests at most 50 messages per run: a full
          sync reads up to 50 inbox messages, a manual sync processes up to 50 messages, and the
          background job processes up to 50 messages per account on each 15-minute cycle. Incremental
          runs use Gmail's History API from the last recorded checkpoint. Messages that are never
          reached by a sync are never read.
        </LegalParagraph>

        <LegalCallout title="Google API Services — Limited Use">
          <p>
            Oppora's use and transfer to any other app of information received from Google APIs will
            adhere to the{' '}
            <LegalLink href="https://developers.google.com/terms/api-services-user-data-policy" external>
              Google API Services User Data Policy
            </LegalLink>
            , including the Limited Use requirements.
          </p>
          <p className="mt-3">
            In particular, Gmail data is used only to provide and improve the user-facing features you
            requested: extracting announcements and showing them in your account. It is not sold, not
            used for advertising, not used to determine creditworthiness or for lending purposes, and
            Oppora does not use it to train its own models. It is not transferred to third parties
            except to the service providers that operate the feature (described below), or where
            required by law or necessary for security.
          </p>
        </LegalCallout>

        <LegalParagraph>
          You can disconnect at any time, and you can also revoke Oppora's access directly from your
          Google Account. Disconnecting inside Oppora deletes our stored tokens; revoking at Google
          prevents any future access even if a token were somehow retained.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'ai-processing',
    title: 'How email content is processed with AI',
    content: (
      <>
        <LegalParagraph>
          Connected mail is processed by an AI model to identify announcements and extract structured
          fields. The following message content is sent to the model provider: the subject, sender,
          plain-text body, Gmail snippet and links found in the body. Attachments and your Google
          credentials are never sent.
        </LegalParagraph>
        <LegalParagraph>
          Oppora currently uses Google's Gemini API through its OpenAI-compatible endpoint, over
          HTTPS, with the model configured on the server (currently{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-caption text-text">
            gemini-2.5-flash
          </code>
          ). The provider may change as the service evolves; the current model is always the one
          configured in our production environment.
        </LegalParagraph>
        <LegalParagraph>
          Email content is treated as untrusted data. The extraction prompt explicitly instructs the
          model to ignore any instructions embedded in an email, and the model's output is validated
          against a strict schema before anything is stored. Messages that are not student-relevant
          produce no announcements.
        </LegalParagraph>
        <LegalParagraph>
          We do not use your email content to train Oppora's own models. Google's handling of data
          submitted through the Gemini API is governed by Google's API terms, which may include logging
          or use permitted under the plan in use. Oppora does not control that provider-side handling.
          If the AI request fails after retries, the message is recorded as failed and no announcements
          are created from it.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'extracted-information',
    title: 'What Oppora extracts',
    content: (
      <>
        <LegalParagraph>
          For each relevant message, Oppora may produce one or more announcement records containing:
        </LegalParagraph>
        <LegalList>
          <li>The announcement title, a short title and a summary description.</li>
          <li>
            A category — for example internship, placement, hackathon, event, scholarship or general —
            and the organisation named in the email.
          </li>
          <li>Role, duration, location and other opportunity details stated in the message.</li>
          <li>
            Key dates, with event dates distinguished from application or registration deadlines.
          </li>
          <li>
            Eligibility criteria exactly as declared, keeping minimum CPI, minimum CGPA and minimum
            percentage as separate values rather than converting between them; eligible branches or
            departments, semester range, graduation years and backlog requirements where stated.
          </li>
          <li>Application links, contact details, and short quoted excerpts used as evidence.</li>
          <li>
            A confidence score and review flags, including warnings when the message contains
            contradictory or ambiguous information.
          </li>
        </LegalList>
        <LegalParagraph>
          A single email can contain several announcements, and each is stored as a separate record.
          Oppora also computes a fingerprint from the title, organisation, application link and
          deadline so that the same opportunity arriving in a forwarded or reminder email updates the
          existing record instead of creating a duplicate.
        </LegalParagraph>
        <LegalParagraph>
          We do not store the full body of your emails in our database. Extracted records do retain
          the source subject line, sender and received date, and may include short quoted fragments
          from the message as supporting evidence.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'storage-security',
    title: 'Storage and security',
    content: (
      <>
        <LegalParagraph>
          Oppora stores data in Supabase (PostgreSQL and authentication), with the application served
          by Vercel and the API running on Render. The following protections are implemented in the
          current product:
        </LegalParagraph>
        <LegalFacts
          items={[
            {
              label: 'Access control',
              value:
                'Supabase row-level security restricts account, profile, Gmail, announcement and notification records to the user who owns them. Privileged service-role access exists only in server-side code for background jobs.',
            },
            {
              label: 'Token encryption',
              value:
                'Gmail access and refresh tokens are encrypted with AES-256-GCM before they are written to the database. The encryption key is derived from a server-side secret using scrypt and is never sent to the browser.',
            },
            {
              label: 'Passwords',
              value:
                'Passwords are handled and hashed by Supabase Auth. Oppora does not store or have access to plain-text passwords.',
            },
            {
              label: 'Transport',
              value:
                'Traffic between your browser, our frontend, our API, Supabase and Google is carried over HTTPS.',
            },
            {
              label: 'Sessions',
              value:
                'Session access tokens are short-lived and refreshed using the stored refresh token. Signing out revokes the session on the server.',
            },
          ]}
        />
        <LegalParagraph>
          No system is perfectly secure. We cannot guarantee that unauthorised access will never
          occur, but we work to limit the data we hold and to protect the credentials that grant
          access to it. If you believe you have found a security issue, please report it to{' '}
          <LegalLink href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</LegalLink>.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Third-party services and data sharing',
    content: (
      <>
        <LegalParagraph>
          Oppora does not sell your personal data, does not share it with advertising networks or data
          brokers, and does not use it for cross-site behavioural advertising. Data is shared only with
          the service providers that operate the product:
        </LegalParagraph>
        <LegalFacts
          items={[
            {
              label: 'Supabase',
              value:
                'Database, authentication and file storage. Stores account, profile, notice, Gmail connection and announcement records.',
            },
            {
              label: 'Render',
              value: 'Hosts the Oppora API and the background sync and reminder jobs.',
            },
            {
              label: 'Vercel',
              value: 'Hosts and serves the Oppora web application.',
            },
            {
              label: 'Google',
              value:
                'Provides OAuth and the Gmail API for mailbox access, and the Gemini API used to extract announcements from message content.',
            },
            {
              label: 'Resend',
              value:
                'Delivers the account-confirmation email when configured, and receives your email address and the content of that message. Without it, Supabase Auth\'s built-in mailer sends the confirmation instead.',
            },
          ]}
        />
        <LegalParagraph>
          Each provider processes data under its own terms and security commitments. We may also
          disclose information where required by law, to respond to valid legal process, to protect
          the rights and safety of users or the public, or to investigate abuse or security incidents.
        </LegalParagraph>
        <LegalParagraph>
          If Oppora is involved in a merger, acquisition or transfer of assets, personal data may be
          transferred as part of that transaction, subject to this policy and applicable law.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention',
    content: (
      <>
        <LegalParagraph>
          Oppora keeps your account and profile data for as long as your account exists. Email
          announcements and the metadata of processed messages are kept until you disconnect the Gmail
          account or ask us to delete your data.
        </LegalParagraph>
        <LegalParagraph>
          There is currently no automatic deletion schedule for accounts, announcements or processed
          email records. We do not claim otherwise. If a retention period is introduced, this policy
          will state it before it takes effect.
        </LegalParagraph>
        <LegalParagraph>
          Disconnecting a Gmail account deletes the stored connection record, and the processed-email
          and announcement records that depend on it are deleted with it. Account deletion removes your
          profile and its associated records, as described below.
        </LegalParagraph>
        <LegalParagraph>
          Our infrastructure providers may retain backups, logs and cached copies for their own
          limited periods under their policies. We cannot guarantee immediate erasure from those
          provider-side copies, though they are not used to serve the product.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'your-controls',
    title: 'Your choices and controls',
    content: (
      <>
        <LegalSubheading>Disconnect Gmail</LegalSubheading>
        <LegalParagraph>
          Open <LegalLink href="/student/gmail-connect">Gmail Connect</LegalLink> in your account and
          choose Disconnect. This deletes the encrypted tokens and the email records associated with
          that connection from our database, and stops all future syncing.
        </LegalParagraph>
        <LegalSubheading>Revoke access at Google</LegalSubheading>
        <LegalParagraph>
          Disconnecting inside Oppora removes our stored credentials but does not itself revoke the
          OAuth grant on Google's side. To remove Oppora from your Google Account entirely, visit{' '}
          <LegalLink href="https://myaccount.google.com/permissions" external>
            Google Account permissions
          </LegalLink>{' '}
          and remove Oppora. This prevents any future access, including from a token that may exist in
          a backup.
        </LegalParagraph>
        <LegalSubheading>Manage your profile</LegalSubheading>
        <LegalParagraph>
          You can review and update your academic profile and account details from the profile page at
          any time.
        </LegalParagraph>
        <LegalSubheading>Dismiss or hide announcements</LegalSubheading>
        <LegalParagraph>
          Extracted announcements can be dismissed or bookmarked individually, which changes what
          appears in your feed.
        </LegalParagraph>
        <LegalSubheading>Delete your account</LegalSubheading>
        <LegalParagraph>
          Oppora does not currently offer a self-service account-deletion control. To delete your
          account and associated data, email{' '}
          <LegalLink href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</LegalLink> from the
          address associated with your account. We will confirm the request and delete your profile and
          the personal records associated with it, except where we are required to retain information
          by law. In limited cases, a notice published by an institutional administrator may remain part
          of that institution's records. Some information may also remain in provider backups for a
          limited period.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    content: (
      <>
        <LegalParagraph>
          Depending on where you live, you may have some or all of the following rights in relation to
          your personal data:
        </LegalParagraph>
        <LegalList>
          <li>Access — request a copy of the personal data we hold about you.</li>
          <li>Correction — ask us to correct inaccurate or incomplete information.</li>
          <li>Deletion — ask us to delete your personal data.</li>
          <li>Restriction or objection — ask us to limit or stop certain processing.</li>
          <li>Portability — request your data in a structured, machine-readable format.</li>
          <li>Withdrawal of consent — withdraw Gmail consent by disconnecting the account.</li>
          <li>
            Complaint — lodge a complaint with your local data protection authority or supervisory
            body.
          </li>
        </LegalList>
        <LegalParagraph>
          To exercise any of these rights, contact{' '}
          <LegalLink href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</LegalLink>. We may
          ask you to verify your identity before acting on a request, and we will respond within the
          timeframe required by applicable law.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'international-transfers',
    title: 'International data transfers',
    content: (
      <>
        <LegalParagraph>
          Oppora's service providers — Supabase, Render, Vercel, Google and Resend — operate
          infrastructure in multiple countries. Your personal data may therefore be processed outside
          the country in which you live, including in the United States.
        </LegalParagraph>
        <LegalParagraph>
          Where required, transfers rely on the safeguards offered by those providers and applicable
          law. You can contact us for more information about the safeguards that apply to a specific
          transfer.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <>
        <LegalParagraph>
          Oppora is intended for students at higher-education institutions and is not directed to
          children. We do not knowingly collect personal data from children. If you believe a child has
          provided personal data to Oppora, contact us and we will take appropriate steps to delete it.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <>
        <LegalParagraph>
          We may update this policy as the product changes. The revised version will be published on
          this page with a new "last updated" date. If a change materially affects how we handle
          personal data or Gmail data, we will provide a clearer notice — in the application or by
          email — before it takes effect.
        </LegalParagraph>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    content: (
      <>
        <LegalParagraph>
          Questions about this policy, or requests relating to your personal data, can be sent to the
          address below. Please include the email address associated with your Oppora account so we can
          find the right records.
        </LegalParagraph>
        <LegalContactCard>
          For privacy questions, data-access requests, correction or deletion requests, and security
          reports, email us. We aim to respond within a reasonable period and within any timeframe
          required by applicable law.
        </LegalContactCard>
      </>
    ),
  },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          What Oppora collects, why it collects it, and how your data — including anything read from a
          connected Gmail account — is processed, stored and deleted.
        </p>
      }
      sections={SECTIONS}
    />
  );
}