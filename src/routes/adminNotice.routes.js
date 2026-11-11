import { Router } from "express";
import {
    createNotice,
    getAdminNotices,
    getAdminNotice,
    updateNotice,
    archiveNotice,
    publishNotice,
    uploadNoticeFile,
    getAdminNoticeFile,
    processNotice,
    getPendingReviewNotices,
    getNoticeExtraction,
    reviewNotice,
    rejectNotice
} from "../controllers/notice.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { validate, validateIdParam } from "../middlewares/validate.middleware.js";
import { uploadNoticePdf } from "../middlewares/upload.middleware.js";
import {
    createNoticeSchema,
    updateNoticeSchema,
    adminNoticeQuerySchema
} from "../validators/notice.validator.js";
import {
    reviewSchema,
    rejectNoticeSchema
} from "../validators/extraction.validator.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.post("/", validate(createNoticeSchema), createNotice);
router.get("/", validate(adminNoticeQuerySchema, "query"), getAdminNotices);
router.get("/pending-review", validate(adminNoticeQuerySchema, "query"), getPendingReviewNotices);
router.get("/:id/file", validateIdParam, getAdminNoticeFile);
router.post("/:id/file", validateIdParam, uploadNoticePdf, uploadNoticeFile);
router.post("/:id/process", validateIdParam, processNotice);
router.post("/:id/retry", validateIdParam, processNotice);
router.get("/:id/extraction", validateIdParam, getNoticeExtraction);
router.patch("/:id/review", validateIdParam, validate(reviewSchema), reviewNotice);
router.post("/:id/reject", validateIdParam, validate(rejectNoticeSchema), rejectNotice);
router.post("/:id/publish", validateIdParam, publishNotice);
router.patch("/:id", validateIdParam, validate(updateNoticeSchema), updateNotice);
router.delete("/:id", validateIdParam, archiveNotice);
router.get("/:id", validateIdParam, getAdminNotice);

export default router;
