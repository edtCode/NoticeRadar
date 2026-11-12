import {
    listPersonalEntries as listPersonalEntriesService,
    createPersonalEntry as createPersonalEntryService,
    updatePersonalEntry as updatePersonalEntryService,
    deletePersonalEntry as deletePersonalEntryService,
    uploadPersonalEntryFile as uploadPersonalEntryFileService,
    getPersonalEntryFileUrl as getPersonalEntryFileUrlService,
    draftPersonalEntryFromSource as draftPersonalEntryFromSourceService
} from "../services/personalEntry.service.js";
import { sendError } from "../utils/errors.js";

export const getPersonalEntries = async (req, res) => {
    try {
        const entries = await listPersonalEntriesService(req.supabase, req.user.id, req.validatedQuery);

        res.status(200).json({
            data: entries
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const createPersonalEntry = async (req, res) => {
    try {
        const entry = await createPersonalEntryService(req.supabase, req.user.id, req.body);

        res.status(201).json({
            data: entry
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const updatePersonalEntry = async (req, res) => {
    try {
        const entry = await updatePersonalEntryService(req.supabase, req.user.id, req.params.id, req.body);

        res.status(200).json({
            data: entry
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const deletePersonalEntry = async (req, res) => {
    try {
        const result = await deletePersonalEntryService(req.supabase, req.user.id, req.params.id);

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const extractPersonalEntryDraft = async (req, res) => {
    try {
        const draft = await draftPersonalEntryFromSourceService({
            file: req.file,
            text: req.body?.text
        });

        res.status(200).json({
            data: draft
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const uploadPersonalEntryFile = async (req, res) => {
    try {
        const result = await uploadPersonalEntryFileService(req.supabase, req.user.id, req.params.id, req.file);

        res.status(201).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getPersonalEntryFile = async (req, res) => {
    try {
        const result = await getPersonalEntryFileUrlService(req.supabase, req.user.id, req.params.id);

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};
