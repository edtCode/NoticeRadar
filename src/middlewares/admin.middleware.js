import { ApiError, sendError } from "../utils/errors.js";

export const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        if (req.user.role !== "ADMIN") {
            throw new ApiError(403, "Admin access required");
        }

        next();

    } catch (error) {
        sendError(res, error);
    }
};
