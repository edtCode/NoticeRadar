import { Router } from "express";
import { getNotices, getNotice, getNoticeFile } from "../controllers/notice.controller.js";
import {
    getFeed,
    searchNotices,
    getNoticeEligibility,
    saveNotice,
    removeSavedNotice,
    getSavedNotices
} from "../controllers/feed.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate, validateIdParam } from "../middlewares/validate.middleware.js";
import { noticeQuerySchema } from "../validators/notice.validator.js";
import {
    feedQuerySchema,
    searchQuerySchema,
    savedNoticeQuerySchema
} from "../validators/feed.validator.js";

const router = Router();

router.use(authenticate);

router.get("/feed", validate(feedQuerySchema, "query"), getFeed);
router.get("/search", validate(searchQuerySchema, "query"), searchNotices);
router.get("/saved", validate(savedNoticeQuerySchema, "query"), getSavedNotices);
router.get("/", validate(noticeQuerySchema, "query"), getNotices);
router.get("/:id/file", validateIdParam, getNoticeFile);
router.get("/:id/eligibility", validateIdParam, getNoticeEligibility);
router.post("/:id/save", validateIdParam, saveNotice);
router.delete("/:id/save", validateIdParam, removeSavedNotice);
router.get("/:id", validateIdParam, getNotice);

export default router;
