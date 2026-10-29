export type GithubRateLimitState = { remaining: number | null; resetAt: number | null };
export function updateRateLimitState(state: GithubRateLimitState, headers: { get: (name: string) => string | null }): GithubRateLimitState;
export function getRateLimitWaitMs(state: GithubRateLimitState, now?: number): number;
export function formatRateLimitWait(waitMs: number): string;
