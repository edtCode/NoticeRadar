import { Router } from "express";
import {
    getPersonalEntries,
    createPersonalEntry,
    updatePersonalEntry,
    deletePersonalEntry,
    uploadPersonalEntryFile,
    getPersonalEntryFile
} from "../controllers/personalEntry.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate, validateIdParam } from "../middlewares/validate.middleware.js";
import { uploadNoticePdf } from "../middlewares/upload.middleware.js";
import {
    personalEntrySchema,
    personalEntryUpdateSchema,
    personalEntryQuerySchema
} from "../validators/personalEntry.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(personalEntryQuerySchema, "query"), getPersonalEntries);
router.post("/", validate(personalEntrySchema), createPersonalEntry);
router.post("/:id/file", validateIdParam, uploadNoticePdf, uploadPersonalEntryFile);
router.get("/:id/file", validateIdParam, getPersonalEntryFile);
router.patch("/:id", validateIdParam, validate(personalEntryUpdateSchema), updatePersonalEntry);
router.delete("/:id", validateIdParam, deletePersonalEntry);

export default router;
