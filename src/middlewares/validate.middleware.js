import { z } from "zod";

export const validate = (schema, source = "body") => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }));

            return res.status(400).json({
                error: "Validation failed",
                details
            });
        }

        if (source === "query") {
            req.validatedQuery = result.data;
        } else {
            req[source] = result.data;
        }

        next();
    };
};

export const validateIdParam = (req, res, next) => {
    const result = z.string().uuid().safeParse(req.params.id);

    if (!result.success) {
        return res.status(400).json({ error: "Invalid identifier" });
    }

    next();
};
