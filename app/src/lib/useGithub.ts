import { useCallback, useEffect, useState } from "react";
import { fetchGithub } from "./github";
// Saf puan mantığı: testler de bu dosyayı kullanır (tests/score.test.mjs).
import { computeScore } from "./score.js";
import { beginGithubFetch, failGithubFetch } from "./github-refresh-state.mjs";

type Data = Awaited<ReturnType<typeof fetchGithub>>;
type Result = ReturnType<typeof computeScore>;
export type GithubState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: Data; result: Result; refreshing?: boolean; refreshError?: string };

export function useGithub(user: string) {
  const [state, setState] = useState<GithubState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const [forceLive, setForceLive] = useState(false);

  useEffect(() => {
    let alive = true;
    setState((previous) => beginGithubFetch(previous, user, forceLive));
    fetchGithub(user, { forceLive })
      .then((data) => alive && setState({ status: "ok", data, result: computeScore(data) }))
      .catch((e: unknown) => alive && setState((previous) => failGithubFetch(previous, user, e)));
    return () => {
      alive = false;
    };
  }, [user, nonce, forceLive]);

  const retry = useCallback(() => {
    setForceLive(true);
    setNonce((n) => n + 1);
  }, []);
  return { state, retry };
}
