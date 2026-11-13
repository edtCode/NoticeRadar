import { Router } from "express";
import {
    getGmailAuthUrl,
    gmailOAuthCallback,
    getGmailStatus,
    disconnectGmail,
    syncGmail,
    listAnnouncements,
    getAnnouncement,
    toggleBookmarkAnnouncement,
    markAnnouncementRead,
    dismissAnnouncementController,
    getAnnouncementsUnreadCount
} from "../controllers/email.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { emailAnnouncementQuerySchema } from "../validators/email-query.validator.js";
import { validateIdParam } from "../middlewares/validate.middleware.js";

const router = Router();

// The OAuth callback is reached by Google's browser redirect and carries no
// Bearer token, so it is deliberately left unauthenticated. The state
// parameter binds the callback to the authenticated user who started the flow.
router.get("/gmail/oauth/callback", gmailOAuthCallback);

// All other email routes require an authenticated student.
router.use(authenticate);

router.get("/gmail/auth-url", getGmailAuthUrl);
router.get("/gmail/status", getGmailStatus);
router.delete("/gmail/disconnect", disconnectGmail);
router.post("/gmail/sync", syncGmail);

router.get("/announcements", validate(emailAnnouncementQuerySchema, "query"), listAnnouncements);
router.get("/announcements/unread-count", getAnnouncementsUnreadCount);
router.get("/announcements/:id", validateIdParam, getAnnouncement);
router.patch("/announcements/:id/bookmark", validateIdParam, toggleBookmarkAnnouncement);
router.patch("/announcements/:id/read", validateIdParam, markAnnouncementRead);
router.patch("/announcements/:id/dismiss", validateIdParam, dismissAnnouncementController);

export default router;
