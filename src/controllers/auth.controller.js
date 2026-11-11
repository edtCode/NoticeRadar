import {
    registerUser as registerUserService,
    loginUser as loginUserService,
    logoutUser as logoutUserService
} from "../services/auth.service.js";
import { sendError } from "../utils/errors.js";

const getClients = (req) => ({
    publicClient: req.app.locals.supabaseClients.getPublicClient(),
    adminClient: req.app.locals.supabaseClients.getAdminClient()
});

export const register = async (req, res) => {
    try {
        const result = await registerUserService(getClients(req), req.body);

        res.status(201).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const login = async (req, res) => {
    try {
        const result = await loginUserService(getClients(req), req.body);

        res.status(200).json({
            data: result
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const logout = async (req, res) => {
    try {
        await logoutUserService(req.supabase);

        res.status(200).json({
            data: { message: "Logged out" }
        });

    } catch (error) {
        sendError(res, error);
    }
};

export const getCurrentUser = async (req, res) => {
    res.status(200).json({
        data: req.user
    });
};
