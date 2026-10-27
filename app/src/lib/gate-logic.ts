import { CONFIG } from "../config";

const G = CONFIG.gate;

export type Challenge = { a: number; b: number; answer: number };

export function makeChallenge(rand: () => number = Math.random): Challenge {
  const a = Math.floor(rand() * 9) + 1;
  const b = Math.floor(rand() * 9) + 1;
  return { a, b, answer: a + b };
}

export function isCorrectAnswer(raw: string, expected: number): boolean {
  return Number(raw.trim()) === expected;
}

export function lockDurationMs(fails: number): number {
  const over = fails - G.maxFailsBeforeLock;
  if (over < 0) return 0;
  return Math.min(G.lockMaxMs, G.lockBaseMs * 2 ** over);
}

export function fillTimeOk(elapsedMs: number): boolean {
  return elapsedMs >= G.minFillMs;
}

export function sliderOk(durationMs: number): boolean {
  return durationMs >= G.sliderMinMs && durationMs <= G.sliderMaxMs;
}

export function interactionsOk(count: number): boolean {
  return count >= G.minInteractions;
}

export function sliderDonePct(): number {
  return G.sliderDonePct;
}

export type GateStored = { fails: number; lockUntil: number };

export function readStored(): GateStored {
  try {
    const raw = localStorage.getItem(G.storeKey);
    if (raw) {
      const parsed = JSON.parse(raw) as GateStored;
      return { fails: Number(parsed.fails) || 0, lockUntil: Number(parsed.lockUntil) || 0 };
    }
  } catch {
    /* depolama kapalıysa sıfır kabul et */
  }
  return { fails: 0, lockUntil: 0 };
}

export function writeStored(state: GateStored): void {
  try {
    localStorage.setItem(G.storeKey, JSON.stringify(state));
  } catch {
    /* yoksay */
  }
}

export function hasValidPass(now: number = Date.now()): boolean {
  try {
    return Number(sessionStorage.getItem(G.passKey)) > now;
  } catch {
    return false;
  }
}

export function grantPass(now: number = Date.now()): void {
  try {
    sessionStorage.setItem(G.passKey, String(now + G.passTtlMs));
  } catch {
    /* yoksay */
  }
}

export function looksAutomated(): boolean {
  return typeof navigator !== "undefined" && (navigator as Navigator & { webdriver?: boolean }).webdriver === true;
}
