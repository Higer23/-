export type ContributionDay = { date: string; count: number };
export type ContributionData = { contributions: ContributionDay[]; [key: string]: unknown };
export function getOptionalContributions(user: string, requestJson: (url: string) => Promise<unknown>): Promise<ContributionData | null>;
