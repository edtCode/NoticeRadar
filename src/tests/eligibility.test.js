import test from "node:test";
import assert from "node:assert/strict";
import { checkEligibility } from "../services/eligibility.service.js";

const student = {
    branch: "Computer Science",
    semester: 5,
    cpi: 8.2,
    graduationYear: 2027,
    activeBacklogs: 0
};

test("a student who meets every restriction is eligible", () => {
    const result = checkEligibility(student, {
        eligible_branches: ["Computer Science", "Information Technology"],
        minimum_cpi: 7.5,
        minimum_semester: 4,
        maximum_semester: 6,
        eligible_graduation_years: [2027],
        requires_no_backlogs: true
    });

    assert.equal(result.status, "ELIGIBLE");
    assert.deepEqual(result.reasons, []);
});

test("branch matching ignores case and punctuation", () => {
    const result = checkEligibility(student, {
        eligible_branches: ["computer-science"],
        minimum_cpi: null,
        minimum_semester: null,
        maximum_semester: null,
        eligible_graduation_years: [],
        requires_no_backlogs: null
    });

    assert.equal(result.status, "ELIGIBLE");
});

test("a clear restriction failure is NOT_ELIGIBLE and beats missing data", () => {
    const result = checkEligibility(
        { ...student, cpi: null },
        {
            eligible_branches: ["Mechanical"],
            minimum_cpi: 8,
            minimum_semester: null,
            maximum_semester: null,
            eligible_graduation_years: [],
            requires_no_backlogs: null
        }
    );

    assert.equal(result.status, "NOT_ELIGIBLE");
    assert.equal(result.reasons.length, 1);
    assert.ok(result.missingFields.includes("cpi"));
});

test("missing student details make the notice possibly eligible", () => {
    const result = checkEligibility(
        { ...student, cpi: null, graduationYear: null },
        {
            eligible_branches: [],
            minimum_cpi: 7,
            minimum_semester: null,
            maximum_semester: null,
            eligible_graduation_years: [2026],
            requires_no_backlogs: null
        }
    );

    assert.equal(result.status, "POSSIBLY_ELIGIBLE");
    assert.deepEqual(result.missingFields.sort(), ["cpi", "graduationYear"]);
});

test("backlog and semester restrictions are enforced", () => {
    const result = checkEligibility(
        { ...student, semester: 7, activeBacklogs: 1 },
        {
            eligible_branches: [],
            minimum_cpi: null,
            minimum_semester: null,
            maximum_semester: 6,
            eligible_graduation_years: [],
            requires_no_backlogs: true
        }
    );

    assert.equal(result.status, "NOT_ELIGIBLE");
    assert.equal(result.reasons.length, 2);
});

test("camelCase notices are accepted as well as database rows", () => {
    const result = checkEligibility(student, {
        eligibleBranches: ["Computer Science"],
        minimumCPI: 9,
        minimumSemester: null,
        maximumSemester: null,
        eligibleGraduationYears: [],
        requiresNoBacklogs: null
    });

    assert.equal(result.status, "NOT_ELIGIBLE");
});
