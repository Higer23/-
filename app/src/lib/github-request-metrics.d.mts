export type GithubRequestOutcome = "success" | "http_error" | "network_error";
export type GithubRequestMetric = {
  requests: number;
  successes: number;
  errors: number;
  lastStatus: number | null;
  lastRemaining: number | null;
  lastDurationMs: number | null;
  lastRequestedAt: number | null;
};
export function classifyGithubEndpoint(input: string): string;
export function recordGithubRequest(input: string, details?: { status?: number | null; remaining?: number | null; outcome?: GithubRequestOutcome; durationMs?: number }): void;
export function getGithubRequestMetrics(): Record<string, GithubRequestMetric>;
export function resetGithubRequestMetrics(): void;
