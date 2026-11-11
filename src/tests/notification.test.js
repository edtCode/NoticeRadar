import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { getReminderTimes, queueReminders, runDeadlineReminderJob } from "../services/notification.service.js";
import { createMockSupabase } from "./helpers/mockSupabase.js";
import {
    buildTestApp,
    createUserClient,
    studentProfileRow,
    STUDENT_ID,
    INSTITUTION_ID,
    NOTICE_ID
} from "./helpers/testApp.js";

const notice = {
    id: NOTICE_ID,
    institution_id: INSTITUTION_ID,
    title: "Summer Internship",
    deadline: "2026-12-01T23:59:59.999Z",
    status: "PUBLISHED",
    review_status: "APPROVED",
    eligible_branches: ["Computer Science"],
    minimum_cpi: null,
    minimum_semester: null,
    maximum_semester: null,
    eligible_graduation_years: [],
    requires_no_backlogs: null
};

test("reminders are scheduled 7, 3 and 1 days before the deadline", () => {
    const times = getReminderTimes(notice.deadline, new Date("2026-11-01T00:00:00.000Z"));

    assert.deepEqual(
        times.map((reminder) => [reminder.days, reminder.scheduledFor.toISOString()]),
        [
            [7, "2026-11-24T09:00:00.000Z"],
            [3, "2026-11-28T09:00:00.000Z"],
            [1, "2026-11-30T09:00:00.000Z"]
        ]
    );
});

test("reminder times already in the past are skipped", () => {
    const times = getReminderTimes(notice.deadline, new Date("2026-11-29T10:00:00.000Z"));

    assert.deepEqual(times.map((reminder) => reminder.days), [1]);
    assert.deepEqual(getReminderTimes(notice.deadline, new Date("2026-12-02T00:00:00.000Z")), []);
});

test("reminders are only queued for eligible and possibly eligible students", async () => {
    const adminClient = createMockSupabase({
        tables: {
            profiles: {
                select: {
                    data: [
                        {
                            id: STUDENT_ID,
                            student_profiles: [{ branch: "Computer Science", semester: 5, cpi: 8.2, graduation_year: 2027, active_backlogs: 0 }]
                        },
                        {
                            id: "99999999-9999-4999-8999-999999999999",
                            student_profiles: [{ branch: "Mechanical", semester: 5, cpi: 8.2, graduation_year: 2027, active_backlogs: 0 }]
                        },
                        { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", student_profiles: [] }
                    ],
                    count: 3
                }
            },
            notifications: { upsert: { error: null } }
        }
    });

    const result = await queueReminders(adminClient, notice);
    const upsertCall = adminClient.calls.find((call) => call.method === "upsert");

    assert.equal(result.created, 3);
    assert.equal(upsertCall.payload.length, 3);
    assert.equal(upsertCall.payload.every((row) => row.user_id === STUDENT_ID), true);
    assert.equal(upsertCall.payload[0].dedupe_key, `${STUDENT_ID}:${NOTICE_ID}:7`);
    assert.equal(upsertCall.options.ignoreDuplicates, true);
});

test("unpublished or unapproved notices do not queue reminders", async () => {
    const adminClient = createMockSupabase({});

    assert.deepEqual(await queueReminders(adminClient, { ...notice, status: "DRAFT" }), { created: 0 });
    assert.deepEqual(await queueReminders(adminClient, { ...notice, review_status: "PENDING_REVIEW" }), { created: 0 });
    assert.equal(adminClient.calls.length, 0);
});

test("the reminder job only looks at approved published notices", async () => {
    const adminClient = createMockSupabase({
        tables: {
            notices: { select: { data: [] } }
        }
    });

    const result = await runDeadlineReminderJob(adminClient);
    const query = adminClient.calls.find((call) => call.table === "notices");

    assert.deepEqual(result, { notices: 0, reminders: 0 });
    assert.ok(query.filters.some((filter) => filter.column === "status" && filter.value === "PUBLISHED"));
    assert.ok(query.filters.some((filter) => filter.column === "review_status" && filter.value === "APPROVED"));
});

const buildStudentApp = (tables) => {
    const userClient = createUserClient({ profile: studentProfileRow, tables });

    return buildTestApp({ adminClient: createMockSupabase({}), userClient });
};

test("notifications are scoped to the student and only returned when due", async () => {
    const app = buildStudentApp({
        notifications: { select: { data: [{ id: "n1", title: "Deadline in 3 days" }], count: 1 } }
    });

    const response = await request(app)
        .get("/api/v1/notifications?page=1&limit=10")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.pagination.total, 1);
});

test("students can mark their own notification as read", async () => {
    const app = buildStudentApp({
        notifications: { update: { data: { id: "n1", read_at: "2026-11-10T00:00:00.000Z" } } }
    });

    const response = await request(app)
        .patch("/api/v1/notifications/88888888-8888-4888-8888-888888888888/read")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.id, "n1");
});

test("marking someone else's notification as read returns a 404", async () => {
    const app = buildStudentApp({
        notifications: { update: { data: null } }
    });

    const response = await request(app)
        .patch("/api/v1/notifications/88888888-8888-4888-8888-888888888888/read")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 404);
});

test("the unread count only counts due notifications", async () => {
    const app = buildStudentApp({
        notifications: { select: { data: null, count: 4 } }
    });

    const response = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", "Bearer valid-token");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.unread, 4);
});
