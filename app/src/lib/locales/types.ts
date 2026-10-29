import type tr from "./tr";

export type Key = keyof typeof tr;
type OptionalInsightKey = "score.insights.title" | "score.insights.strong";
export type Dict = Omit<Record<Key, string>, OptionalInsightKey> &
  Partial<Pick<Record<Key, string>, OptionalInsightKey>>;
