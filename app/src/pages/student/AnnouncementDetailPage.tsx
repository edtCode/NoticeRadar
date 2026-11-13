import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink, Mail, Calendar, Clock as ClockIcon,
  AlertTriangle, ChevronLeft, Bookmark, BookmarkCheck, Link as LinkIcon
} from 'lucide-react';
import { emailService } from '../../services/email.service';
import {
  useBookmarkAnnouncement,
  useMarkAnnouncementRead,
  useDismissAnnouncement
} from '../../hooks/useEmailService';
import {
  Button, Badge, ErrorState, Skeleton
} from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { ROUTES } from '../../constants';
import { useAddToast } from '../../stores/uiStore';
import type { EmailAnnouncement, EmailDateDetail } from '../../types/email';

const CATEGORY_LABELS: Record<string, string> = {
  internship: 'Internship',
  summer_internship: 'Summer Internship',
  winter_internship: 'Winter Internship',
  full_time_placement: 'Full-Time Placement',
  off_campus_placement: 'Off-Campus Placement',
  on_campus_placement: 'On-Campus Placement',
  graduate_hiring: 'Graduate Hiring',
  job_opportunity: 'Job Opening',
  apprenticeship: 'Apprenticeship',
  recruitment_drive: 'Recruitment Drive',
  referral_opportunity: 'Referral Opportunity',
  hackathon: 'Hackathon',
  coding_competition: 'Coding Competition',
  technical_fest: 'Technical Fest',
  workshop: 'Workshop',
  webinar: 'Webinar',
  seminar: 'Seminar',
  technical_conference: 'Technical Conference',
  project_competition: 'Project Competition',
  developer_event: 'Developer Event',
  scholarship: 'Scholarship',
  fellowship: 'Fellowship',
  research_opportunity: 'Research Opportunity',
  student_ambassador: 'Student Ambassador',
  leadership_program: 'Leadership Program',
  training_program: 'Training Program',
  certification_program: 'Certification Program',
  entrepreneurship_program: 'Entrepreneurship Program',
  incubation_program: 'Incubation Program',
  academic_notice: 'Academic Notice',
  examination_notice: 'Examination Notice',
  registration_notice: 'Registration Notice',
  department_notice: 'Department Notice',
  administrative_notice: 'Administrative Notice',
  holiday_notice: 'Holiday Notice',
  fee_notice: 'Fee Notice',
  result_announcement: 'Result Announcement',
  general_event: 'General Event',
  club_activity: 'Club Activity',
  cultural_fest: 'Cultural Fest',
  sports_event: 'Sports Event',
  important_announcement: 'Important Announcement',
  other: 'Other',
  irrelevant: 'Irrelevant'
};

export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [savePendingLocal, setSavePendingLocal] = useState(false);
  const addToast = useAddToast();

  const bookmarkMutation = useBookmarkAnnouncement();
  const readMutation = useMarkAnnouncementRead();
  const dismissMutation = useDismissAnnouncement();

  const announcementQuery = useQuery({
    queryKey: ['email', 'announcements', id],
    queryFn: () => emailService.getAnnouncement(id!),
    enabled: !!id,
    staleTime: 60_000
  });

  const announcement = announcementQuery.data;

  if (!id) return <ErrorState title="Announcement not found" />;

  if (announcementQuery.isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton variant="rectangular" height={24} width={200} />
        <Skeleton variant="text" lines={2} />
        <div className="bg-bg-elevated border border-border rounded-lg p-6 space-y-4">
          <Skeleton height={28} width="70%" />
          <Skeleton variant="text" lines={4} />
          <Skeleton height={120} width="100%" />
        </div>
      </div>
    );
  }

  if (announcementQuery.isError || !announcement) {
    return (
      <ErrorState
        icon={<AlertTriangle className="w-8 h-8" />}
        title="Announcement unavailable"
        message="Could not load this announcement. It may have been dismissed or removed."
        action={{ label: 'Back to announcements', onClick: () => history.back() }}
      />
    );
  }

  const isSaved = announcement.is_bookmarked;
  const isRead = announcement.is_read;

  const opportunity = announcement.opportunity_details ?? {};
  const eligibility = announcement.eligibility_details ?? {};
  const dates = announcement.important_dates ?? {};
  const event = announcement.event_details ?? {};
  const links = announcement.links ?? {};
  const contact = announcement.contact_details ?? {};
  const org = { name: announcement.organization_name, type: announcement.organization_type };

  const confidence = announcement.extraction_confidence ?? null;

  const toggleSave = () => {
    setSavePendingLocal(true);
    bookmarkMutation.mutate(announcement.id, {
      onSettled: () => setSavePendingLocal(false),
      onError: () => addToast({ type: 'error', title: 'Could not update bookmark' })
    });
  };

  const markRead = () => {
    readMutation.mutate(announcement.id, {
      onError: () => addToast({ type: 'error', title: 'Could not mark as read' })
    });
  };

  const formatDateField = (field: { normalizedDate: string | null; originalText?: string | null } | null) => {
    if (!field?.normalizedDate) return field?.originalText ?? null;
    return field.normalizedDate.slice(0, 10);
  };

  const row = (label: string, value: string | number | null) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex justify-between gap-4 py-2 border-b border-border last:border-b-0 key:sm:text-left">
        <dt className="text-body-sm text-text-muted flex-shrink-0">{label}</dt>
        <dd className="text-body-sm text-text text-right">{String(value)}</dd>
      </div>
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link to={ROUTES.STUDENT_ANNOUNCEMENTS} className="inline-flex items-center gap-1 text-body-sm text-text-muted hover:text-text transition-colors">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> All announcements
      </Link>

      <header className="bg-bg-elevated border border-border rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="info" size="sm">
            {CATEGORY_LABELS[announcement.primary_category] ?? announcement.primary_category}
          </Badge>
          <Badge
            variant={announcement.importance === 'critical' ? 'danger' : announcement.importance === 'high' ? 'warning' : 'info'}
            size="sm"
          >
            {announcement.importance.charAt(0).toUpperCase() + announcement.importance.slice(1)}
          </Badge>
          {confidence != null && (
            <span className="text-caption text-text-muted">AI confidence {Math.round(confidence * 100)}%</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-h1 font-semibold text-text text-pretty">{announcement.title}</h1>
            {announcement.short_title && (
              <p className="text-body text-text-muted mt-1">{announcement.short_title}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSave}
                disabled={savePendingLocal || bookmarkMutation.isPending}
                aria-pressed={isSaved}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-body-sm transition-colors disabled:opacity-50"
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-accent" /> : <Bookmark className="w-4 h-4" />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={markRead}
                disabled={readMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-body-sm transition-colors disabled:opacity-50"
              >
                {isRead ? 'Read' : 'Mark Read'}
              </button>
              <button
                onClick={() => dismissMutation.mutate(announcement.id)}
                disabled={dismissMutation.isPending}
                className="text-text-muted hover:text-danger px-3 py-1.5 rounded-sm text-body-sm transition-colors disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-text-muted">
          {announcement.source_email_received_at && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-4 h-4" aria-hidden="true" />
              Received {formatDate(announcement.source_email_received_at)}
            </span>
          )}
          {announcement.source_email_sender && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-4 h-4" aria-hidden="true" />
              From: {announcement.source_email_sender}
            </span>
          )}
          {dates.applicationDeadline?.normalizedDate && (
            <span className={`inline-flex items-center gap-1.5 font-medium ${Date.now() > new Date(dates.applicationDeadline.normalizedDate).getTime() ? 'text-danger' : 'text-warning'}`}>
              <ClockIcon className="w-4 h-4" aria-hidden="true" />
              Application deadline {formatDateField(dates.applicationDeadline)}
            </span>
          )}
          {dates.eventStartDate?.normalizedDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Event {formatDateField(dates.eventStartDate)}
            </span>
          )}
        </div>
      </header>

      {/* Description */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="description-heading">
        <h2 id="description-heading" className="text-h4 font-semibold text-text mb-3">Description</h2>
        <p className="text-body text-text-muted whitespace-pre-line">{announcement.description}</p>
      </section>

      {/* Organization */}
      {org.name && (
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="org-heading">
          <h2 id="org-heading" className="text-h4 font-semibold text-text mb-3">Organization</h2>
          <dl>
            {row('Name', org.name)}
            {org.type && row('Type', String(org.type).replace(/_/g, ' '))}
          </dl>
          {links.officialWebsite && (
            <div className="mt-3">
              <a href={links.officialWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-accent hover:underline break-all">
                <LinkIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> Official website
              </a>
            </div>
          )}
        </section>
      )}

      {/* Opportunity details */}
      {
        (opportunity.role || opportunity.location || opportunity.stipend || opportunity.salary || opportunity.duration || opportunity.workMode) && (
          <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="opportunity-heading">
            <h2 id="opportunity-heading" className="text-h4 font-semibold text-text mb-3">Opportunity Details</h2>
            <dl>
              {row('Role', opportunity.role)}
              {row('Location', opportunity.location)}
              {opportunity.workMode && row('Work Mode', String(opportunity.workMode).replace(/_/g, ' '))}
              {row('Duration', opportunity.duration)}
              {row('Stipend', opportunity.stipend)}
              {opportunity.currency && opportunity.stipend && row('Currency', opportunity.currency)}
              {row('Salary / CTC', opportunity.salary)}
              {opportunity.openings != null && row('Openings', opportunity.openings)}
              {opportunity.interviewRounds != null && row('Interview Rounds', opportunity.interviewRounds)}
              {opportunity.applicationProcess && row('Application Process', opportunity.applicationProcess)}
            </dl>
            {opportunity.requiredSkills?.length > 0 && (
              <div className="mt-3">
                <p className="text-body-sm font-medium text-text mb-1">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.requiredSkills.map((s) => (
                    <span key={s} className="px-2 py-1 rounded bg-bg border border-border text-body-sm text-text-muted">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {opportunity.jobDescription && (
              <div className="mt-3">
                <p className="text-body-sm font-medium text-text mb-1">Job Description</p>
                <p className="text-body text-text-muted whitespace-pre-line">{opportunity.jobDescription}</p>
              </div>
            )}
          </section>
        )
      }

      {/* Eligibility */}
      {
        (eligibility.departments?.length || eligibility.branches?.length || eligibility.minimumCPI != null || eligibility.minimumCGPA != null || eligibility.minimumPercentage != null || eligibility.noActiveBacklogs != null || eligibility.academicYears?.length) && (
          <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="eligibility-heading">
            <h2 id="eligibility-heading" className="text-h4 font-semibold text-text mb-3">Eligibility</h2>
            <dl>
              {eligibility.departments?.length && row('Departments', eligibility.departments.join(', '))}
              {eligibility.branches?.length && row('Branches', eligibility.branches.join(', '))}
              {eligibility.degrees?.length && row('Degrees', eligibility.degrees.join(', '))}
              {eligibility.academicYears?.length && row('Academic Years', eligibility.academicYears.join(', '))}
              {eligibility.graduationBatches?.length && row('Graduation Batches', eligibility.graduationBatches.join(', '))}
              {eligibility.minimumCPI != null && row('Minimum CPI', eligibility.minimumCPI)}
              {eligibility.minimumCGPA != null && row('Minimum CGPA', eligibility.minimumCGPA)}
              {eligibility.minimumPercentage != null && row('Minimum Percentage', `${eligibility.minimumPercentage}%`)}
              {eligibility.maximumActiveBacklogs != null && row('Max Active Backlogs', eligibility.maximumActiveBacklogs)}
              {eligibility.noActiveBacklogs === true && row('Backlogs', 'No active backlogs')}
              {eligibility.requiredExperience && row('Required Experience', eligibility.requiredExperience)}
            </dl>
            {eligibility.originalEligibilityText && (
              <div className="mt-3 p-3 rounded bg-info-soft/50 border border-info/30">
                <p className="text-body-sm text-info font-medium mb-1">Original wording</p>
                <p className="text-body-sm text-text-muted italic">{eligibility.originalEligibilityText}</p>
              </div>
            )}
          </section>
        )
      }

      {/* Dates */}
      {
        (dates.eventStartDate?.normalizedDate || dates.eventEndDate?.normalizedDate || dates.applicationDeadline?.normalizedDate || dates.registrationDeadline?.normalizedDate || dates.internshipStartDate?.normalizedDate || dates.interviewDate?.normalizedDate) && (
          <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="dates-heading">
            <h2 id="dates-heading" className="text-h4 font-semibold text-text mb-3">Important Dates</h2>
            <dl>
              {dates.announcementDate && row('Announcement Date', formatDateField(dates.announcementDate))}
              {dates.applicationStartDate && row('Applications Open', formatDateField(dates.applicationStartDate))}
              {dates.applicationDeadline && row('Application Deadline', formatDateField(dates.applicationDeadline))}
              {dates.registrationDeadline && row('Registration Deadline', formatDateField(dates.registrationDeadline))}
              {dates.eventStartDate && row('Event Start', formatDateField(dates.eventStartDate))}
              {dates.eventEndDate && row('Event End', formatDateField(dates.eventEndDate))}
              {dates.internshipStartDate && row('Internship Start', formatDateField(dates.internshipStartDate))}
              {dates.internshipEndDate && row('Internship End', formatDateField(dates.internshipEndDate))}
              {dates.interviewDate && row('Interview Date', formatDateField(dates.interviewDate))}
              {dates.otherImportantDates?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <dt className="text-body-sm text-text-muted">Other dates</dt>
                  <ul className="mt-1 space-y-1 text-body-sm text-text-muted">
                    {dates.otherImportantDates.map((d: EmailDateDetail, i: number) => (
                      <li key={i} className="flex justify-between">
                        <span>{d.dateType.replace(/_/g, ' ')}</span>
                        <span>{formatDateField(d)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </dl>
          </section>
        )
      }

      {/* Event details */}
      {
        (event.organizer || event.venue || event.format || event.teamSize || event.participationFee || event.prizePool || event.schedule?.length) && (
          <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="event-heading">
            <h2 id="event-heading" className="text-h4 font-semibold text-text mb-3">Event Details</h2>
            <dl>
              {row('Organizer', event.organizer)}
              {row('Venue', event.venue)}
              {event.format && row('Format', String(event.format).replace(/_/g, ' '))}
              {row('Team Size', event.teamSize)}
              {row('Participation Fee', event.participationFee)}
              {row('Prize Pool', event.prizePool)}
            </dl>
            {event.schedule?.length > 0 && (
              <div className="mt-3">
                <p className="text-body-sm font-medium text-text mb-1">Schedule</p>
                <ul className="space-y-1 text-body-sm text-text-muted list-disc list-inside">
                  {event.schedule.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )
      }

      {/* Links */}
      {
        (links.applicationLink || links.registrationLink || links.otherLinks?.length) && (
          <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="links-heading">
            <h2 id="links-heading" className="text-h4 font-semibold text-text mb-3">Links</h2>
            {links.applicationLink && (
              <div className="mb-2">
                <a href={links.applicationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-accent hover:underline break-all">
                  <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> Application Link
                </a>
              </div>
            )}
            {links.registrationLink && (
              <div className="mb-2">
                <a href={links.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-accent hover:underline break-all">
                  <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> Registration Link
                </a>
              </div>
            )}
            {links.otherLinks?.length > 0 && (
              <div>
                <p className="text-body-sm font-medium text-text mb-2">Other Links</p>
                <ul className="space-y-1">
                  {links.otherLinks.map((url: string, i: number) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-body-sm text-text-muted hover:underline break-all block">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )
      }

      {/* Contact */}
      {
        (contact.name || contact.email || contact.phone) && (
          <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="text-h4 font-semibold text-text mb-3">Contact</h2>
            <dl>
              {row('Name', contact.name)}
              {row('Email', contact.email)}
              {row('Phone', contact.phone)}
            </dl>
          </section>
        )
      }

      {/* Warnings */}
      {
        announcement.extraction_warnings?.length > 0 && (
          <section className="bg-danger-soft border border-danger/30 rounded-lg p-5" aria-labelledby="warnings-heading">
            <h2 id="warnings-heading" className="flex items-center gap-2 text-h4 font-semibold text-danger mb-3">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" /> Review Notes
            </h2>
            <p className="text-body text-text mb-2">The AI flagged the following — verify against the original email:</p>
            <ul className="list-disc list-inside space-y-1 text-body-sm text-text-muted">
              {announcement.extraction_warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        )
      }

      {/* Source reference */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6 text-body-sm text-text-muted" aria-labelledby="source-heading">
        <h2 id="source-heading" className="text-body-sm font-medium text-text mb-2">Source</h2>
        <p className="text-body-sm text-text-muted">
          Extracted from an authorized Gmail message. Confidence score and
          warnings are AI-generated — always verify deadlines and eligibility
          against the official source before applying.
        </p>
      </section>
    </div>
  );
}
