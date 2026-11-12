export type UserRole = "STUDENT" | "ADMIN";

export type NoticeCategory =
    | "PLACEMENT"
    | "INTERNSHIP"
    | "SCHOLARSHIP"
    | "EXAM"
    | "EVENT"
    | "GENERAL";

export type NoticeStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ExtractionStatus =
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "OCR_REQUIRED";

export type ReviewStatus =
    | "NOT_REVIEWED"
    | "PENDING_REVIEW"
    | "APPROVED"
    | "REJECTED";

export type EligibilityStatus =
    | "ELIGIBLE"
    | "NOT_ELIGIBLE"
    | "POSSIBLY_ELIGIBLE";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    institutionId: string | null;
}

export interface SessionTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    tokenType: string;
}

export interface LoginResponse {
    user: AuthUser;
    session: SessionTokens;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    institutionId?: string;
}

export interface RegisterResponse {
    user: AuthUser;
    session: SessionTokens | null;
    requiresEmailConfirmation: boolean;
}

export interface Institution {
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    state?: string | null;
    institution_type?: string | null;
}

export interface InstitutionSearchResult {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    institution_type: string | null;
}

export interface InstitutionRequestPayload {
    name: string;
    city?: string;
    state?: string;
    institutionType?: string;
}

export interface InstitutionRequestRecord {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    institution_type: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    institution_id: string;
}

export interface StudentProfileRecord {
    id: string;
    user_id: string;
    department_id: string;
    branch: string;
    semester: number;
    cpi: number;
    graduation_year: number;
    active_backlogs: number;
    interests: string[];
    created_at?: string;
    updated_at?: string;
    departments?: { id: string; name: string } | null;
}

export interface StudentProfileResponse {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    institution_id: string | null;
    created_at: string;
    updated_at: string;
    institutions: Institution | null;
    student_profiles: StudentProfileRecord | StudentProfileRecord[] | null;
}

export interface StudentProfilePayload {
    institutionId: string;
    departmentName: string;
    branch: string;
    semester: number;
    cpi: number;
    graduationYear: number;
    activeBacklogs: number;
    interests: string[];
}

export type StudentProfileUpdatePayload = Partial<StudentProfilePayload>;

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Paginated<T> {
    data: T[];
    pagination: Pagination;
}

export interface Eligibility {
    status: EligibilityStatus;
    reasons: string[];
    missingFields: string[];
}

export interface ExtractionEvidence {
    field: string;
    pageNumber: number | null;
    text: string;
}

export interface Notice {
    id: string;
    institution_id: string;
    title: string;
    description: string;
    summary: string | null;
    category: NoticeCategory;
    application_url: string | null;
    source_url: string | null;
    deadline: string | null;
    published_at: string | null;
    status: NoticeStatus;
    created_by: string;
    approved_by: string | null;
    file_path: string | null;
    file_name: string | null;
    file_size: number | null;
    eligible_branches: string[];
    minimum_cpi: number | null;
    minimum_semester: number | null;
    maximum_semester: number | null;
    eligible_graduation_years: number[];
    requires_no_backlogs: boolean | null;
    required_documents: string[];
    duration: string | null;
    extracted_data: Record<string, unknown> | null;
    extraction_evidence: ExtractionEvidence[] | null;
    extraction_status: ExtractionStatus;
    extraction_error: string | null;
    extracted_at: string | null;
    review_status: ReviewStatus;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    eligibility?: Eligibility;
}

export interface NoticeQuery {
    page?: number;
    limit?: number;
    category?: NoticeCategory;
    search?: string;
    publishedFrom?: string;
    publishedTo?: string;
    deadlineFrom?: string;
    deadlineTo?: string;
}

export interface FeedQuery extends NoticeQuery {
    eligibility?: EligibilityStatus;
    sort?: "recent" | "deadline";
}

export interface SavedNoticeRow {
    id: string;
    notice_id: string;
    created_at: string;
    notices: Pick<
        Notice,
        | "id"
        | "title"
        | "summary"
        | "category"
        | "deadline"
        | "published_at"
        | "application_url"
        | "file_name"
    > | null;
}

export interface SavedNotice {
    id: string;
    notice_id: string;
    created_at: string;
    notices: NoticeSummaryRow | null;
}

export interface NoticeSummaryRow {
    id: string;
    title: string;
    summary: string | null;
    category: NoticeCategory;
    deadline: string | null;
    published_at: string | null;
    application_url: string | null;
    file_name: string | null;
}

export interface UpcomingDeadline extends Notice {
    eligibility: Eligibility;
}

export interface AppNotification {
    id: string;
    notice_id: string | null;
    type: string;
    title: string;
    message: string;
    scheduled_for: string;
    created_at: string;
    read_at: string | null;
}

export interface ProcessingLog {
    id: string;
    status: ExtractionStatus;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export interface ExtractedNotice {
    title: string | null;
    category: NoticeCategory | null;
    summary: string | null;
    deadline: string | null;
    eligibleBranches: string[];
    minimumCPI: number | null;
    minimumSemester: number | null;
    maximumSemester: number | null;
    eligibleGraduationYears: number[];
    requiresNoBacklogs: boolean | null;
    requiredDocuments: string[];
    duration: string | null;
    applicationUrl: string | null;
    ambiguousFields: string[];
    evidence: ExtractionEvidence[];
}

export interface ExtractionWorkspace {
    noticeId: string;
    extractionStatus: ExtractionStatus;
    reviewStatus: ReviewStatus;
    extractionError: string | null;
    extractedAt: string | null;
    extractedData: ExtractedNotice | null;
    evidence: ExtractionEvidence[] | null;
    approvedData: {
        title: string;
        summary: string | null;
        category: NoticeCategory;
        deadline: string | null;
        eligible_branches: string[];
        minimum_cpi: number | null;
        minimum_semester: number | null;
        maximum_semester: number | null;
        eligible_graduation_years: number[];
        requires_no_backlogs: boolean | null;
        required_documents: string[];
        duration: string | null;
        application_url: string | null;
    };
    logs: ProcessingLog[];
}

export interface ReviewPayload {
    title?: string;
    summary?: string | null;
    category?: NoticeCategory;
    deadline?: string | null;
    eligibleBranches?: string[];
    minimumCPI?: number | null;
    minimumSemester?: number | null;
    maximumSemester?: number | null;
    eligibleGraduationYears?: number[];
    requiresNoBacklogs?: boolean | null;
    requiredDocuments?: string[];
    duration?: string | null;
    applicationUrl?: string | null;
    decision?: "APPROVED" | "REJECTED";
    reviewNote?: string;
}

export interface CreateNoticePayload {
    title: string;
    description: string;
    category: NoticeCategory;
    summary?: string | null;
    applicationUrl?: string | null;
    sourceUrl?: string | null;
    deadline?: string | null;
    eligibleBranches?: string[];
    minimumCPI?: number | null;
    minimumSemester?: number | null;
    maximumSemester?: number | null;
    eligibleGraduationYears?: number[];
    requiresNoBacklogs?: boolean | null;
    requiredDocuments?: string[];
    duration?: string | null;
    status?: "DRAFT" | "PUBLISHED";
}

export interface UploadedFileInfo {
    notice: Pick<Notice, "id" | "file_path" | "file_name" | "file_size" | "updated_at">;
    signedUrl: string;
    expiresIn: number;
}

export interface FileLink {
    signedUrl: string;
    fileName?: string;
    expiresIn: number;
}

export interface ProcessResult {
    notice: Pick<
        Notice,
        | "id"
        | "title"
        | "status"
        | "review_status"
        | "extraction_status"
        | "extraction_error"
        | "extracted_at"
        | "extracted_data"
        | "extraction_evidence"
    >;
    extraction: ExtractedNotice | null;
    status: ExtractionStatus;
    message: string | null;
}

export interface ApiErrorPayload {
    error: string;
    details?: { field: string; message: string }[];
}

export interface NoticeFiltersState {
    search: string;
    category: NoticeCategory | "";
    publishedFrom: string;
    publishedTo: string;
    deadlineFrom: string;
    deadlineTo: string;
    sort: "recent" | "deadline";
}

export type PersonalEntrySource = 'MANUAL' | 'UPLOAD' | 'EMAIL';

export interface PersonalEntry {
    id: string;
    title: string;
    description: string | null;
    category: NoticeCategory;
    deadline: string | null;
    event_date: string | null;
    source: PersonalEntrySource;
    source_email: string | null;
    file_name: string | null;
    file_size: number | null;
    eligible_branches: string[];
    minimum_cpi: number | null;
    requires_no_backlogs: boolean | null;
    created_at: string;
    updated_at: string;
    eligibility?: Eligibility;
}

export interface PersonalEntryPayload {
    title: string;
    description?: string;
    category?: NoticeCategory;
    deadline?: string | null;
    eventDate?: string | null;
    eligibleBranches?: string[];
    minimumCPI?: number | null;
    requiresNoBacklogs?: boolean | null;
}

export interface PersonalEntryDraft {
    title: string;
    description: string;
    category: NoticeCategory;
    deadline: string | null;
    eventDate: string | null;
    eligibleBranches: string[];
    minimumCPI: number | null;
    requiresNoBacklogs: boolean | null;
    ambiguousFields: string[];
}

export interface PersonalEntryFileResult {
    entry: PersonalEntry;
    signedUrl: string;
    expiresIn: number;
}
