export function fetchAllGithubPages<T>(fetchPage: (page: number) => Promise<T[]>, isValidPage: (value: unknown) => boolean, pageSize?: number, maxPages?: number): Promise<T[]>;
