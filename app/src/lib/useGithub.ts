import { useCallback, useEffect, useState } from "react";
import { fetchGithub } from "./github";
// Saf puan mantığı: testler de bu dosyayı kullanır (tests/score.test.mjs).
import { computeScore } from "../../../assets/js/score.js";

type Data = Awaited<ReturnType<typeof fetchGithub>>;
type Result = ReturnType<typeof computeScore>;
export type GithubState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: Data; result: Result };

export function useGithub(user: string) {
  const [state, setState] = useState<GithubState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    fetchGithub(user)
      .then((data) => alive && setState({ status: "ok", data, result: computeScore(data) }))
      .catch((e: unknown) => alive && setState({ status: "error", error: e instanceof Error ? e.message : String(e) }));
    return () => {
      alive = false;
    };
  }, [user, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { state, retry };
}
