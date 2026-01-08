// Simple In-Memory Cache for API Responses
// Stores data with a TTL (Time To Live) to prevent spamming the upstream provider (Firebase)

interface CacheEntry {
    data: any;
    expiry: number;
}

const cache = new Map<string, CacheEntry>();

export const getFromCache = (key: string) => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    return entry.data;
};

export const setCache = (key: string, data: any, ttlSeconds: number = 2) => { // Default 2s cache
    cache.set(key, {
        data,
        expiry: Date.now() + (ttlSeconds * 1000)
    });
};
