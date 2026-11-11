import {
    getStudentProfile as getStudentProfileService,
    createStudentProfile as createStudentProfileService,
    updateStudentProfile as updateStudentProfileService
} from "../services/student.service.js";
import { sendError } from "../utils/errors.js";

export const getProfile = async (req, res) => {
    try {
        const profile = await getStudentProfileService(req.supabase, req.user.id);

        res.status(200).json({
            data: profile
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const createProfile = async (req, res) => {
    try {
        const profile = await createStudentProfileService(req.supabase, req.user.id, req.body);

        res.status(201).json({
            data: profile
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const profile = await updateStudentProfileService(req.supabase, req.user.id, req.body);

        res.status(200).json({
            data: profile
        });

    } catch (error) {
        sendError(res, error);
    }
};
