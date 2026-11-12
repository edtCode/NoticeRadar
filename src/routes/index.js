import { Router } from "express";
import authRoutes from "./auth.routes.js";
import studentRoutes from "./student.routes.js";
import noticeRoutes from "./notice.routes.js";
import adminNoticeRoutes from "./adminNotice.routes.js";
import notificationRoutes, { deadlineRouter } from "./notification.routes.js";
import institutionRoutes from "./institution.routes.js";
import personalEntryRoutes from "./personalEntry.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/institutions", institutionRoutes);
router.use("/students", studentRoutes);
router.use("/me/entries", personalEntryRoutes);
router.use("/notices", noticeRoutes);
router.use("/notifications", notificationRoutes);
router.use("/deadlines", deadlineRouter);
router.use("/admin/notices", adminNoticeRoutes);

export default router;
