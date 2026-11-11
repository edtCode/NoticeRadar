import { Router } from "express";
import { getProfile, createProfile, updateProfile } from "../controllers/student.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { studentProfileSchema, studentProfileUpdateSchema } from "../validators/student.validator.js";

const router = Router();

router.use(authenticate);

router.get("/profile", getProfile);
router.post("/profile", validate(studentProfileSchema), createProfile);
router.patch("/profile", validate(studentProfileUpdateSchema), updateProfile);

export default router;
