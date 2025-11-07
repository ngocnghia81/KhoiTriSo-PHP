// Use direct backend URL instead of Next.js proxy
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

export const TOKEN_STORAGE_KEY = 'token';

// Separate base for forum (MongoDB-backed service). Rewritten in next.config.ts
export const FORUM_API_BASE_URL = '/forum-api';

