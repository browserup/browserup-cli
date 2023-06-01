export function convertKeysToCamelCase(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Base case: return non-object values as is
    }

    if (Array.isArray(obj)) {
        return obj.map(convertKeysToCamelCase); // Recursively convert array elements
    }

    const camelCasedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
            camelCasedObj[camelCaseKey] = convertKeysToCamelCase(obj[key]); // Recursively convert nested objects
        }
    }

    return camelCasedObj;
}

export function camelCaseToUnderscore(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => camelCaseToUnderscore(item));
    }

    const converted = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const convertedKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

            if (typeof value === 'object' && value !== null) {
                converted[convertedKey] = camelCaseToUnderscore(value);
            } else {
                converted[convertedKey] = value;
            }
        }
    }

    return converted;
}
