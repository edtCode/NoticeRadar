import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";
import { extractionSchema } from "../validators/extraction.validator.js";

const REQUEST_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = `
You extract structured information from college notices.

Rules:
- Use only information explicitly present in the notice text.
- Never invent deadlines, CPI requirements, branches, semesters, graduation years or application URLs.
- Use null for missing single values and [] for missing lists.
- If a date has no year, return null for deadline and add the field name to ambiguousFields.
- evidence must be an ARRAY of objects, each with keys: field (string), pageNumber (number or null), text (short quote from the page).
- Example evidence value: [{"field":"deadline","pageNumber":1,"text":"Applications close on 2026-12-15"}]
- Never state that any student is eligible.
- Never decide whether the notice should be published.
- Respond with a single JSON object only, with these keys:
  title, category, summary, deadline, eligibleBranches, minimumCPI, minimumSemester, maximumSemester,
  eligibleGraduationYears, requiresNoBacklogs, requiredDocuments, duration, applicationUrl, ambiguousFields, evidence.
- category must be one of: PLACEMENT, INTERNSHIP, SCHOLARSHIP, EXAM, EVENT, GENERAL.
- deadline must be YYYY-MM-DD or null.
`;

const getConfig = () => {
    const { provider, apiKey, baseUrl, model } = env.llm;

    if (!apiKey) {
        throw new ApiError(503, "AI extraction is not configured: LLM_API_KEY is missing");
    }

    return {
        provider,
        apiKey,
        baseUrl: baseUrl.replace(/\/+$/, ""),
        model
    };
};

const buildUserPrompt = (pages) => {
    const content = pages
        .map((page) => `--- Page ${page.pageNumber} ---\n${page.text}`)
        .join("\n\n");

    return `Extract the notice information from this document:\n\n${content}`;
};

const toEvidenceItem = (field, value) => {
    if (value && typeof value === "object") {
        const text = value.text ?? value.quote ?? value.value;
        if (typeof text !== "string" || !text.trim()) return null;
        return {
            field,
            pageNumber: value.pageNumber ?? value.page ?? null,
            text
        };
    }

    if (typeof value === "string" && value.trim()) {
        return { field, pageNumber: null, text: value };
    }

    return null;
};

// Providers do not always follow the evidence shape: some return an object keyed
// by field instead of an array of { field, pageNumber, text }.
const normalizeEvidence = (evidence) => {
    if (Array.isArray(evidence)) return evidence;

    if (evidence && typeof evidence === "object") {
        return Object.entries(evidence).flatMap(([field, value]) => {
            const values = Array.isArray(value) ? value : [value];
            return values.map((item) => toEvidenceItem(field, item)).filter(Boolean);
        });
    }

    return evidence;
};

const normalizeExtraction = (parsed) => {
    if (!parsed || typeof parsed !== "object") return parsed;

    const category = typeof parsed.category === "string" ? parsed.category.toUpperCase() : parsed.category;

    return {
        ...parsed,
        category,
        evidence: normalizeEvidence(parsed.evidence)
    };
};

const parseContent = (content) => {
    const cleaned = String(content ?? "")
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        throw new ApiError(422, "AI provider returned malformed JSON");
    }
};

const requestCompletion = async (config, userPrompt) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                temperature: 0,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const body = await response.text();
            const error = new Error(`LLM request failed with ${response.status}`);
            error.status = response.status;
            error.body = body.slice(0, 500);
            throw error;
        }

        const data = await response.json();

        return data.choices?.[0]?.message?.content;
    } finally {
        clearTimeout(timeout);
    }
};

const requestWithRetry = async (config, userPrompt) => {
    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            return await requestCompletion(config, userPrompt);
        } catch (error) {
            lastError = error;

            if (error.name === "AbortError") {
                throw new ApiError(504, "AI provider request timed out");
            }

            const retryable = error.status === 429 || error.status >= 500;

            console.error("LLM request error:", error.status ?? error.message);

            if (!retryable || attempt === MAX_ATTEMPTS) {
                break;
            }
        }
    }

    if (lastError?.status === 401 || lastError?.status === 403) {
        throw new ApiError(503, "AI provider rejected the configured credentials");
    }

    if (lastError?.status === 429) {
        throw new ApiError(503, "AI provider rate limit reached, try again later");
    }

    if (lastError?.status >= 500) {
        throw new ApiError(502, "AI provider is temporarily unavailable");
    }

    throw new ApiError(502, "AI extraction request failed");
};

export const extractNoticeFromText = async (pages) => {
    const config = getConfig();
    const content = await requestWithRetry(config, buildUserPrompt(pages));
    const parsed = normalizeExtraction(parseContent(content));
    const result = extractionSchema.safeParse(parsed);

    if (!result.success) {
        const firstIssue = result.error.issues[0];
        throw new ApiError(422, `AI provider returned invalid extraction data: ${firstIssue.path.join(".")} ${firstIssue.message}`);
    }

    return result.data;
};
