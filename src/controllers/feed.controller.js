import {
    getNoticeFeed as getNoticeFeedService,
    searchNotices as searchNoticesService,
    getNoticeEligibility as getNoticeEligibilityService,
    getUpcomingDeadlines as getUpcomingDeadlinesService
} from "../services/notice.service.js";
import {
    saveNotice as saveNoticeService,
    removeSavedNotice as removeSavedNoticeService,
    getSavedNotices as getSavedNoticesService
} from "../services/saved.service.js";
import {
    getUserNotifications as getUserNotificationsService,
    getUnreadCount as getUnreadCountService,
    markNotificationRead as markNotificationReadService
} from "../services/notification.service.js";
import { sendError } from "../utils/errors.js";

export const getFeed = async (req, res) => {
    try {
        const result = await getNoticeFeedService(req.supabase, req.user, req.validatedQuery);

        res.status(200).json(result);

    } catch (error) {
        sendError(res, error);
    }
};

export const searchNotices = async (req, res) => {
    try {
        const result = await searchNoticesService(req.supabase, req.user, req.validatedQuery);

        res.status(200).json(result);

    } catch (error) {
        sendError(res, error);
    }
};

export const getNoticeEligibility = async (req, res) => {
    try {
        const result = await getNoticeEligibilityService(req.supabase, req.user, req.params.id);

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const saveNotice = async (req, res) => {
    try {
        const saved = await saveNoticeService(
            req.supabase,
            req.user.id,
            req.params.id,
            req.user.institutionId
        );

        res.status(201).json({
            data: saved
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const removeSavedNotice = async (req, res) => {
    try {
        const result = await removeSavedNoticeService(
            req.supabase,
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getSavedNotices = async (req, res) => {
    try {
        const result = await getSavedNoticesService(req.supabase, req.user.id, req.validatedQuery);

        res.status(200).json(result);

    } catch (error) {
        sendError(res, error);
    }
};

export const getNotifications = async (req, res) => {
    try {
        const result = await getUserNotificationsService(req.supabase, req.user.id, req.validatedQuery);

        res.status(200).json(result);

    } catch (error) {
        sendError(res, error);
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const result = await getUnreadCountService(req.supabase, req.user.id);

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const notification = await markNotificationReadService(
            req.supabase,
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            data: notification
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getUpcomingDeadlines = async (req, res) => {
    try {
        const deadlines = await getUpcomingDeadlinesService(
            req.supabase,
            req.user,
            req.validatedQuery
        );

        res.status(200).json({
            data: deadlines
        });

    } catch (error) {
        sendError(res, error);
    }
};
