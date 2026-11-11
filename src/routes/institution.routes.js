import { Router } from "express";
import { getDepartments, getInstitutions } from "../controllers/institution.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateIdParam } from "../middlewares/validate.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/", getInstitutions);
router.get("/:id/departments", validateIdParam, getDepartments);

export default router;
