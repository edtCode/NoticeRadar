import {
    createNotice as createNoticeService,
    getAdminNotices as getAdminNoticesService,
    getAdminNotice as getAdminNoticeService,
    updateNotice as updateNoticeService,
    publishNotice as publishNoticeService,
    archiveNotice as archiveNoticeService,
    getPublishedNotices as getPublishedNoticesService,
    getPublishedNotice as getPublishedNoticeService,
    getPendingReviewNotices as getPendingReviewNoticesService,
    getNoticeExtraction as getNoticeExtractionService,
    reviewNotice as reviewNoticeService
} from "../services/notice.service.js";
import { processNotice as processNoticeService } from "../services/processing.service.js";
import {
    queueReminders as queueRemindersService,
    replaceFutureReminders as replaceFutureRemindersService
} from "../services/notification.service.js";
import {
    uploadNoticeFile as uploadNoticeFileService,
    getAdminNoticeFileUrl as getAdminNoticeFileUrlService,
    getPublishedNoticeFileUrl as getPublishedNoticeFileUrlService
} from "../services/storage.service.js";
import { sendError } from "../utils/errors.js";

const queueRemindersSafely = async (req, notice, replace = false) => {
    const adminClient = req.app.locals.supabaseClients?.getAdminClient?.();

    if (!adminClient) {
        return;
    }

    try {
        if (replace) {
            await replaceFutureRemindersService(adminClient, notice);
            return;
        }

        await queueRemindersService(adminClient, notice);
    } catch (error) {
        console.error("Could not queue deadline reminders:", error.message);
    }
};

export const getNotices = async (req, res) => {
    try {
        const result = await getPublishedNoticesService(
            req.supabase,
            req.user.institutionId,
            req.validatedQuery
        );

        res.status(200).json(result);

    } catch (error) {
        sendError(res, error);
    }
};

export const getNotice = async (req, res) => {
    try {
        const notice = await getPublishedNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId
        );

        res.status(200).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getNoticeFile = async (req, res) => {
    try {
        const file = await getPublishedNoticeFileUrlService(
            req.supabase,
            req.params.id,
            req.user.institutionId
        );

        res.status(200).json({
            data: file
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const createNotice = async (req, res) => {
    try {
        const notice = await createNoticeService(req.supabase, req.body, req.user);

        res.status(201).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getAdminNotices = async (req, res) => {
    try {
        const result = await getAdminNoticesService(
            req.supabase,
            req.user.institutionId,
            req.validatedQuery
        );

        res.status(200).json(result);

    } catch (error) {
        sendError(res, error);
    }
};

export const getAdminNotice = async (req, res) => {
    try {
        const notice = await getAdminNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId
        );

        res.status(200).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const updateNotice = async (req, res) => {
    try {
        const notice = await updateNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId,
            req.user.id,
            req.body
        );

        if (req.body.deadline !== undefined) {
            await queueRemindersSafely(req, notice, true);
        }

        res.status(200).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const publishNotice = async (req, res) => {
    try {
        const notice = await publishNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId,
            req.user.id
        );

        await queueRemindersSafely(req, notice);

        res.status(200).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const archiveNotice = async (req, res) => {
    try {
        const notice = await archiveNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId
        );

        res.status(200).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const processNotice = async (req, res) => {
    try {
        const result = await processNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId
        );

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getPendingReviewNotices = async (req, res) => {
    try {
        const result = await getPendingReviewNoticesService(
            req.supabase,
            req.user.institutionId,
            req.validatedQuery
        );

        res.status(200).json(result);

    } catch (error) {
        sendError(res, error);
    }
};

export const getNoticeExtraction = async (req, res) => {
    try {
        const result = await getNoticeExtractionService(
            req.supabase,
            req.params.id,
            req.user.institutionId
        );

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const reviewNotice = async (req, res) => {
    try {
        const notice = await reviewNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId,
            req.user.id,
            req.body
        );

        res.status(200).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const rejectNotice = async (req, res) => {
    try {
        const notice = await reviewNoticeService(
            req.supabase,
            req.params.id,
            req.user.institutionId,
            req.user.id,
            {
                decision: "REJECTED",
                reviewNote: req.body.reviewNote
            }
        );

        res.status(200).json({
            data: notice
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const uploadNoticeFile = async (req, res) => {
    try {
        const result = await uploadNoticeFileService(
            req.supabase,
            req.params.id,
            req.user.institutionId,
            req.file
        );

        res.status(201).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getAdminNoticeFile = async (req, res) => {
    try {
        const file = await getAdminNoticeFileUrlService(
            req.supabase,
            req.params.id,
            req.user.institutionId
        );

        res.status(200).json({
            data: file
        });

    } catch (error) {
        sendError(res, error);
    }
};
