import { Router } from "express";
import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    getUpcomingDeadlines
} from "../controllers/feed.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate, validateIdParam } from "../middlewares/validate.middleware.js";
import {
    notificationQuerySchema,
    upcomingDeadlineQuerySchema
} from "../validators/feed.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(notificationQuerySchema, "query"), getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", validateIdParam, markNotificationRead);

export const deadlineRouter = Router();

deadlineRouter.use(authenticate);

deadlineRouter.get("/upcoming", validate(upcomingDeadlineQuerySchema, "query"), getUpcomingDeadlines);

export default router;
