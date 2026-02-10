
const looksLikeJson = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
};

export const parseMultipartFields = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const [key, raw] of Object.entries(req.body)) {
            // Always trim incoming string fields
            if (typeof raw === 'string') {
                req.body[key] = raw.trim();
            }

            // Parse any JSON-looking string fields (after trimming)
            if (typeof req.body[key] === 'string' && looksLikeJson(req.body[key])) {
                try {
                    req.body[key] = JSON.parse(req.body[key]);
                } catch (_) {
                    // leave as-is if not valid JSON
                }
            }
        }
    }
    return next();
};

