export function coalesceRequest<T>(inFlight: Map<string, Promise<T>>, key: string, request: () => Promise<T> | T): Promise<T>;
