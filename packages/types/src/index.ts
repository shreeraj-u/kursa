// Shared API contract types for the Kursa monorepo.
// These are the authoritative shapes for data crossing the server/web boundary.
// All JSON fields (aspirations, values) use camelCase — the server's Zod validators
// normalise snake_case input before persisting.

export * from './models/user';
export * from './models/job';

export * from './api/dashboard';
export * from './api/common';
export * from './api/insights';
export * from './api/paths';
export * from './api/resume';
export * from './api/onboarding';
