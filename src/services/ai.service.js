import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";
import { extractionSchema, personalExtractionSchema } from "../validators/extraction.validator.js";

const REQUEST_TIMEOUT_MS = 30000;
const OCR_TIMEOUT_MS = 120000;
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

const PERSONAL_SYSTEM_PROMPT = `
You extract the key details of a college notice or event from a document the student uploaded or pasted, so they do not have to type them.

Rules:
- Use only information explicitly present in the text.
- Never invent deadlines, event dates, titles or categories.
- title: a short, specific title (max 200 characters). If the document has no title, write one from the content.
- description: 1-3 sentences covering eligibility, venue, links or anything else the student would want to remember.
- category must be one of: PLACEMENT, INTERNSHIP, SCHOLARSHIP, EXAM, EVENT, GENERAL.
- deadline and eventDate must be YYYY-MM-DD or null. If a date has no year, return null and add the field name to ambiguousFields.
- eligibleBranches: branch names the notice restricts to (e.g. ["CSE", "IT"]). Use [] when all branches may apply or the text does not restrict branches.
- minimumCPI: the minimum CPI the notice asks for, as a number, or null when it states none.
- requiresNoBacklogs: true only when the text says students must have no active backlogs, otherwise null.
- Use null for anything the text does not state, and [] for ambiguousFields when nothing is unclear.
- Respond with a single JSON object only, with these keys:
  title, description, category, deadline, eventDate, eligibleBranches, minimumCPI, requiresNoBacklogs, ambiguousFields.
`;

const OCR_SYSTEM_PROMPT = `
You transcribe scanned or image-only pages of official college notices.

Rules:
- Each image is one page. A "Page N:" line before an image tells you which page it is.
- Return every word on each page exactly as written: headings, dates, numbers, tables, addresses and links.
- Keep the natural reading order. Put each table row on its own line.
- Do not summarise, translate, correct, reword or add anything that is not on a page.
- Use an empty string for a page that has no readable text.
- Respond with a single JSON object only, with one key: pages, an array of { "pageNumber": number, "text": string }.
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

const requestCompletion = async (config, userPrompt, systemPrompt = SYSTEM_PROMPT, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
                    { role: "system", content: systemPrompt },
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

const requestWithRetry = async (config, userPrompt, systemPrompt = SYSTEM_PROMPT, options = {}) => {
    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            return await requestCompletion(config, userPrompt, systemPrompt, options);
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

// Reads the pages that have no text layer at all (scans or photos placed in a
// PDF) by sending all of their rendered page images to the configured
// vision-capable model in one request.
export const transcribePageImages = async (images) => {
    const config = getConfig();
    const content = images.flatMap(({ pageNumber, dataUrl }) => [
        { type: "text", text: `Page ${pageNumber}:` },
        { type: "image_url", image_url: { url: dataUrl } }
    ]);

    const response = await requestWithRetry(config, content, OCR_SYSTEM_PROMPT, { timeoutMs: OCR_TIMEOUT_MS });
    const parsed = parseContent(response);

    // Providers occasionally answer a single page with a bare { text } object.
    if (!Array.isArray(parsed?.pages) && typeof parsed?.text === "string" && images.length === 1) {
        return [{ pageNumber: images[0].pageNumber, text: parsed.text.trim() }];
    }

    return (Array.isArray(parsed?.pages) ? parsed.pages : [])
        .map((page) => ({
            pageNumber: Number(page?.pageNumber),
            text: typeof page?.text === "string" ? page.text.trim() : ""
        }))
        .filter((page) => Number.isInteger(page.pageNumber));
};

// Used by the student's own "Add a notice or event" flow, where the document is
// read and the form filled in for them instead of being sent to review.
export const extractPersonalEntryFromText = async (pages) => {
    const config = getConfig();
    const content = await requestWithRetry(config, buildUserPrompt(pages), PERSONAL_SYSTEM_PROMPT);
    const parsed = normalizeExtraction(parseContent(content));
    const result = personalExtractionSchema.safeParse(parsed);

    if (!result.success) {
        const firstIssue = result.error.issues[0];
        throw new ApiError(422, `AI provider returned invalid extraction data: ${firstIssue.path.join(".")} ${firstIssue.message}`);
    }

    return result.data;
};
