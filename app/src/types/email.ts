export type EmailAccount = {
  id: string;
  user_id: string;
  google_sub: string;
  email_address: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scope: string | null;
  last_history_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailAnnouncementCategory =
  | "internship"
  | "summer_internship"
  | "winter_internship"
  | "full_time_placement"
  | "off_campus_placement"
  | "on_campus_placement"
  | "graduate_hiring"
  | "job_opportunity"
  | "apprenticeship"
  | "recruitment_drive"
  | "referral_opportunity"
  | "hackathon"
  | "coding_competition"
  | "technical_fest"
  | "workshop"
  | "webinar"
  | "seminar"
  | "technical_conference"
  | "project_competition"
  | "developer_event"
  | "scholarship"
  | "fellowship"
  | "research_opportunity"
  | "student_ambassador"
  | "leadership_program"
  | "training_program"
  | "certification_program"
  | "entrepreneurship_program"
  | "incubation_program"
  | "academic_notice"
  | "examination_notice"
  | "registration_notice"
  | "department_notice"
  | "administrative_notice"
  | "holiday_notice"
  | "fee_notice"
  | "result_announcement"
  | "general_event"
  | "club_activity"
  | "cultural_fest"
  | "sports_event"
  | "important_announcement"
  | "other"
  | "irrelevant";

export type EmailAnnouncementStatus = "active" | "dismissed" | "archived";
export type EmailAnnouncementImportance = "critical" | "high" | "medium" | "low";

export type EmailDateDetail = {
  originalText?: string | null;
  normalizedDate: string | null;
  time: string | null;
  timezone: string | null;
  dateType: string;
};

export type EmailOpportunity = {
  role: string | null;
  duration: string | null;
  location: string | null;
  workMode: "remote" | "hybrid" | "on_site" | null;
  stipend: string | null;
  salary: string | null;
  currency: string | null;
  openings: number | null;
  applicationProcess: string | null;
  applicationLink: string | null;
  jobDescription: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  selectionProcess: string[];
  interviewRounds: number | null;
  jobResponsibilities: string[];
};

export type EmailEligibility = {
  departments: string[];
  branches: string[];
  degrees: string[];
  academicYears: string[];
  graduationBatches: number[];
  minimumCPI: number | null;
  minimumCGPA: number | null;
  minimumPercentage: number | null;
  maximumActiveBacklogs: number | null;
  noActiveBacklogs: boolean | null;
  noHistoricalBacklogs: boolean | null;
  genderEligibility: string | null;
  requiredAcademicQualifications: string[];
  requiredSkills: string[];
  requiredExperience: string | null;
  otherConditions: string[];
  excludedBranches: string[];
  excludedAcademicYears: string[];
  originalEligibilityText: string;
};

export type EmailImportantDates = {
  announcementDate: EmailDateDetail | null;
  applicationStartDate: EmailDateDetail | null;
  applicationDeadline: EmailDateDetail | null;
  registrationDeadline: EmailDateDetail | null;
  eventStartDate: EmailDateDetail | null;
  eventEndDate: EmailDateDetail | null;
  internshipStartDate: EmailDateDetail | null;
  internshipEndDate: EmailDateDetail | null;
  jobJoiningDate: EmailDateDetail | null;
  assessmentDate: EmailDateDetail | null;
  interviewDate: EmailDateDetail | null;
  prePlacementTalkDate: EmailDateDetail | null;
  workshopDate: EmailDateDetail | null;
  webinarDate: EmailDateDetail | null;
  examinationDate: EmailDateDetail | null;
  otherImportantDates: EmailDateDetail[];
};

export type EmailEventDetails = {
  organizer: string | null;
  venue: string | null;
  format: "online" | "offline" | "hybrid" | null;
  teamSize: string | null;
  participationFee: string | null;
  prizePool: string | null;
  schedule: string[];
};

export type EmailLinks = {
  applicationLink: string | null;
  registrationLink: string | null;
  officialWebsite: string | null;
  otherLinks: string[];
};

export type EmailContact = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type EmailOrganization = {
  name: string | null;
  type: string | null;
};

export type EmailAnnouncement = {
  id: string;
  user_id: string;
  processed_email_id: string;
  title: string;
  short_title: string | null;
  description: string;
  primary_category: EmailAnnouncementCategory;
  secondary_category: EmailAnnouncementCategory | null;
  announcement_type: string | null;
  organization_name: string | null;
  organization_type: string | null;
  opportunity_details: EmailOpportunity;
  eligibility_details: EmailEligibility;
  important_dates: EmailImportantDates;
  event_details: EmailEventDetails;
  links: EmailLinks;
  contact_details: EmailContact;
  source_email_subject: string | null;
  source_email_sender: string | null;
  source_email_received_at: string | null;
  extraction_confidence: number | null;
  review_required: boolean;
  extraction_warnings: string[];
  status: EmailAnnouncementStatus;
  importance: EmailAnnouncementImportance;
  is_bookmarked: boolean;
  is_read: boolean;
  dedupe_fingerprint: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailAnnouncementQuery = {
  page?: number;
  limit?: number;
  category?: string;
  importance?: "critical" | "high" | "medium" | "low";
  search?: string;
  minCpi?: number;
  deadlineFrom?: string;
  deadlineTo?: string;
  sort?: "recent" | "deadline";
};

export type PaginatedEmailAnnouncements = {
  data: EmailAnnouncement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type GmailConnectStatus = {
  connected: boolean;
  emailAddress: string | null;
  lastHistoryId: string | null;
};

export type SyncResult = {
  mode: string;
  processed: number;
  results: Array<{
    skipped?: boolean;
    processed?: boolean;
    messageId: string;
    announcementCount?: number;
    isRelevant?: boolean;
    error?: string;
  }>;
  historyId: string | null;
};
