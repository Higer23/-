import { useEffect, useState } from "react";
import { getGithubRequestMetrics } from "../lib/github";

/** Visible only in Vite development mode when ?debug=github is present. */
export default function GithubDiagnostics() {
  const [metrics, setMetrics] = useState(() => getGithubRequestMetrics());
  useEffect(() => {
    const refresh = () => setMetrics(getGithubRequestMetrics());
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const entries = Object.entries(metrics);
  const totals = entries.reduce((sum, [, item]) => ({
    requests: sum.requests + item.requests,
    successes: sum.successes + item.successes,
    errors: sum.errors + item.errors,
  }), { requests: 0, successes: 0, errors: 0 });

  return (
    <aside className="github-diagnostics" aria-label="GitHub API diagnostics">
      <div className="github-diagnostics-head">
        <strong>GitHub API diagnostics</strong>
        <span>DEV ONLY</span>
      </div>
      <p>{totals.requests} requests · {totals.successes} OK · {totals.errors} errors</p>
      {entries.length === 0 ? <p>No API requests recorded in this session.</p> : (
        <table>
          <thead><tr><th>Endpoint</th><th>Calls</th><th>Last status</th><th>Quota</th><th>Latency</th></tr></thead>
          <tbody>{entries.map(([endpoint, item]) => (
            <tr key={endpoint}>
              <th scope="row">{endpoint}</th>
              <td>{item.requests}</td>
              <td>{item.lastStatus ?? "—"}</td>
              <td>{item.lastRemaining ?? "—"}</td>
              <td>{item.lastDurationMs === null ? "—" : `${item.lastDurationMs} ms`}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
      <small>In-memory only. Usernames, query strings and tokens are not stored.</small>
    </aside>
  );
}
