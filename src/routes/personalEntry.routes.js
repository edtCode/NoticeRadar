import { Router } from "express";
import {
    getPersonalEntries,
    createPersonalEntry,
    updatePersonalEntry,
    deletePersonalEntry,
    uploadPersonalEntryFile,
    getPersonalEntryFile,
    extractPersonalEntryDraft
} from "../controllers/personalEntry.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate, validateIdParam } from "../middlewares/validate.middleware.js";
import { uploadNoticePdf } from "../middlewares/upload.middleware.js";
import {
    personalEntrySchema,
    personalEntryUpdateSchema,
    personalEntryQuerySchema,
    personalEntryTextSchema
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
router.post("/:id/file", validateIdParam, uploadNoticePdf, uploadPersonalEntryFile);
router.get("/:id/file", validateIdParam, getPersonalEntryFile);
router.patch("/:id", validateIdParam, validate(personalEntryUpdateSchema), updatePersonalEntry);
router.delete("/:id", validateIdParam, deletePersonalEntry);

export default router;
