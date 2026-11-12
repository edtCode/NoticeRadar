import {
    getInstitutions as getInstitutionsService,
    getDepartments as getDepartmentsService,
    searchInstitutions as searchInstitutionsService,
    createInstitutionRequest as createInstitutionRequestService
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

// Public so the registration form can search before a session exists. The
// service-role client is used deliberately because anonymous users have no
// row-level access to institutions; the query is validated and parameterized.
export const searchInstitutions = async (req, res) => {
    try {
        const { getAdminClient } = req.app.locals.supabaseClients;
        const institutions = await searchInstitutionsService(getAdminClient(), req.validatedQuery.q);
        res.status(200).json({ data: institutions });
    } catch (error) {
        sendError(res, error);
    }
};

export const createInstitutionRequest = async (req, res) => {
    try {
        const request = await createInstitutionRequestService(req.supabase, req.user.id, req.body);
        res.status(201).json({ data: request });
    } catch (error) {
        sendError(res, error);
    }
};
