// Use `process as any` to avoid requiring Node types in client code
// Prefer same-origin /api (rewritten by Next.js to backend) to avoid CORS in dev
export const API_BASE_URL = '/api';

export const TOKEN_STORAGE_KEY = 'kts_access_token';

// Separate base for forum (MongoDB-backed service). Rewritten in next.config.ts
export const FORUM_API_BASE_URL = '/forum-api';

