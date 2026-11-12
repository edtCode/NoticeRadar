import { Router } from "express";
import {
    getPersonalEntries,
    createPersonalEntry,
    updatePersonalEntry,
    deletePersonalEntry,
    uploadPersonalEntryFile,
    getPersonalEntryFile,
    extractPersonalEntryDraft,
    previewPersonalEntryEligibility
} from "../controllers/personalEntry.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate, validateIdParam } from "../middlewares/validate.middleware.js";
import { uploadNoticePdf } from "../middlewares/upload.middleware.js";
import {
    personalEntrySchema,
    personalEntryUpdateSchema,
    personalEntryQuerySchema,
    personalEntryTextSchema,
    personalEntryCriteriaSchema
} from "../validators/personalEntry.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(personalEntryQuerySchema, "query"), getPersonalEntries);
router.post("/", validate(personalEntrySchema), createPersonalEntry);

// Accepts either a PDF upload or JSON { text } and returns the extracted fields.
router.post(
    "/extract",
    uploadNoticePdf,
    (req, res, next) => (req.file ? next() : validate(personalEntryTextSchema)(req, res, next)),
    extractPersonalEntryDraft
);
// Re-checks eligibility for criteria the student edits in the form.
router.post("/eligibility", validate(personalEntryCriteriaSchema), previewPersonalEntryEligibility);
router.post("/:id/file", validateIdParam, uploadNoticePdf, uploadPersonalEntryFile);
router.get("/:id/file", validateIdParam, getPersonalEntryFile);
router.patch("/:id", validateIdParam, validate(personalEntryUpdateSchema), updatePersonalEntry);
router.delete("/:id", validateIdParam, deletePersonalEntry);

export default router;
