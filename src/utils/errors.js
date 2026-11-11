export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export const databaseError = (error) => {
    console.error("Database error:", error);

    switch (error?.code) {
        case "PGRST116":
            return new ApiError(404, "Resource not found");
        case "23505":
            return new ApiError(409, "Resource already exists");
        case "23503":
            return new ApiError(400, "Related resource does not exist");
        case "42501":
            return new ApiError(403, "You do not have permission to perform this action");
        case "22P02":
            return new ApiError(400, "Invalid identifier");
        default:
            return new ApiError(500, "Something went wrong");
    }
};

export const sendError = (res, error) => {
    if (error instanceof ApiError) {
        return res.status(error.status).json({ error: error.message });
    }

    console.error(error);

    return res.status(500).json({ error: "Something went wrong" });
};
