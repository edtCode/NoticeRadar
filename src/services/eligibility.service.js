const normalizeBranch = (value) => {
    return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
};

const isSpecified = (value) => value !== null && value !== undefined;

const noticeValue = (notice, camelCaseKey, snakeCaseKey) => {
    return notice[camelCaseKey] !== undefined ? notice[camelCaseKey] : notice[snakeCaseKey];
};

export const checkEligibility = (student, notice) => {
    const reasons = [];
    const missingFields = [];

    const branches = noticeValue(notice, "eligibleBranches", "eligible_branches") ?? [];

    if (branches.length > 0) {
        if (!student.branch) {
            missingFields.push("branch");
        } else {
            const normalizedBranches = branches.map(normalizeBranch);

            if (!normalizedBranches.includes(normalizeBranch(student.branch))) {
                reasons.push(`Branch ${student.branch} is not eligible for this notice`);
            }
        }
    }

    const minimumCpi = noticeValue(notice, "minimumCPI", "minimum_cpi");

    if (isSpecified(minimumCpi)) {
        if (!isSpecified(student.cpi)) {
            missingFields.push("cpi");
        } else if (Number(student.cpi) < Number(minimumCpi)) {
            reasons.push(`CPI ${student.cpi} is below the required minimum CPI of ${minimumCpi}`);
        }
    }

    const minimumSemester = noticeValue(notice, "minimumSemester", "minimum_semester");

    if (isSpecified(minimumSemester)) {
        if (!isSpecified(student.semester)) {
            missingFields.push("semester");
        } else if (Number(student.semester) < Number(minimumSemester)) {
            reasons.push(`Semester ${student.semester} is below the minimum semester of ${minimumSemester}`);
        }
    }

    const maximumSemester = noticeValue(notice, "maximumSemester", "maximum_semester");

    if (isSpecified(maximumSemester)) {
        if (!isSpecified(student.semester)) {
            if (!missingFields.includes("semester")) {
                missingFields.push("semester");
            }
        } else if (Number(student.semester) > Number(maximumSemester)) {
            reasons.push(`Semester ${student.semester} is above the maximum semester of ${maximumSemester}`);
        }
    }

    const graduationYears = noticeValue(notice, "eligibleGraduationYears", "eligible_graduation_years") ?? [];

    if (graduationYears.length > 0) {
        if (!isSpecified(student.graduationYear)) {
            missingFields.push("graduationYear");
        } else if (!graduationYears.map(Number).includes(Number(student.graduationYear))) {
            reasons.push(`Graduation year ${student.graduationYear} is not in the eligible graduation years`);
        }
    }

    const requiresNoBacklogs = noticeValue(notice, "requiresNoBacklogs", "requires_no_backlogs");

    if (requiresNoBacklogs === true) {
        if (!isSpecified(student.activeBacklogs)) {
            missingFields.push("activeBacklogs");
        } else if (Number(student.activeBacklogs) > 0) {
            reasons.push(`This notice requires no active backlogs, but ${student.activeBacklogs} are recorded`);
        }
    }

    if (reasons.length > 0) {
        return { status: "NOT_ELIGIBLE", reasons, missingFields };
    }

    if (missingFields.length > 0) {
        return { status: "POSSIBLY_ELIGIBLE", reasons: [], missingFields };
    }

    return { status: "ELIGIBLE", reasons: [], missingFields: [] };
};
