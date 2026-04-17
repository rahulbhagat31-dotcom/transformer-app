/**
 * Lightweight HTML Sanitizer
 * Encodes < > " ' & characters to prevent XSS injection
 * Use this for wrapping dynamic variables in template strings assigned to innerHTML
 */
function sanitizeHTML(str) {
    if (str == null) return '';
    if (typeof str !== 'string') return String(str);

    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Sanitize an object by sanitizing all string values
 * Useful for sanitizing entire API responses before rendering
 */
function sanitizeObject(obj) {
    if (obj == null) return null;
    if (typeof obj === 'string') return sanitizeHTML(obj);
    if (typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitized[key] = sanitizeHTML(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
}

/**
 * Create a safe HTML string from template with sanitized variables
 * Usage: safeHTML`<div>${name}</div>`(context)
 */
function safeHTML(strings, ...values) {
    let result = '';
    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length) {
            result += sanitizeHTML(values[i]);
        }
    }
    return result;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sanitizeHTML, sanitizeObject, safeHTML };
}