import multer from "multer";
import { env } from "../config/env.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: env.maxUploadBytes,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
            return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF files are allowed"));
        }

        callback(null, true);
    }
});

export const uploadNoticePdf = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ error: "File is too large" });
        }

        if (error instanceof multer.MulterError) {
            return res.status(400).json({ error: error.field || "Invalid file upload" });
        }

        next(error);
    });
};
