import { Router } from "express";
import {
    getDepartments,
    getInstitutions,
    searchInstitutions,
    createInstitutionRequest
} from "../controllers/institution.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate, validateIdParam } from "../middlewares/validate.middleware.js";
import { institutionRequestSchema, institutionSearchSchema } from "../validators/institution.validator.js";

const router = Router();

// Must stay public: registration searches institutions before signing in.
router.get("/search", validate(institutionSearchSchema, "query"), searchInstitutions);

router.use(authenticate);
router.get("/", getInstitutions);
router.post("/requests", validate(institutionRequestSchema), createInstitutionRequest);
router.get("/:id/departments", validateIdParam, getDepartments);

export default router;
