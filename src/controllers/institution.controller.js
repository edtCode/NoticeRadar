import {
    getInstitutions as getInstitutionsService,
    getDepartments as getDepartmentsService
} from "../services/institution.service.js";
import { sendError } from "../utils/errors.js";

export const getInstitutions = async (req, res) => {
    try {
        const institutions = await getInstitutionsService(req.supabase);
        res.status(200).json({ data: institutions });
    } catch (error) {
        sendError(res, error);
    }
};

export const getDepartments = async (req, res) => {
    try {
        const departments = await getDepartmentsService(req.supabase, req.params.id);
        res.status(200).json({ data: departments });
    } catch (error) {
        sendError(res, error);
    }
};
