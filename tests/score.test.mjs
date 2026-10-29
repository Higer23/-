import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, grade, streaks } from '../app/src/lib/score.js';

const NOW = Date.UTC(2026, 9, 21);
const baseProfile = { login: 'Higer23', public_repos: 10, followers: 5, bio: 'x', blog: '', location: '', company: '', created_at: '2025-04-19T00:00:00Z' };
const repo = (over = {}) => ({ fork: false, language: 'Python', stargazers_count: 0, pushed_at: new Date(NOW).toISOString(), description: 'd', ...over });

test('grade sınırları', () => {
  assert.equal(grade(90), 'A+');
  assert.equal(grade(89.9), 'A');
  assert.equal(grade(50), 'D');
  assert.equal(grade(49), 'E');
});

test('seriler: bugün 0 ise güncel seri dünden sayılır', () => {
  const days = [1, 1, 1, 0, 1, 1, 0].map((c) => ({ count: c }));
  assert.deepEqual(streaks(days), { current: 2, longest: 3 });
});

test('puan 0-100 aralığında ve parça toplamı ile tutarlı', () => {
  const r = computeScore({ profile: baseProfile, repos: [repo()], contrib: { contributions: [] }, now: NOW });
  assert.ok(r.score >= 0 && r.score <= 100);
  const sum = r.parts.reduce((a, p) => a + p.val, 0);
  assert.equal(r.score, Math.round(sum));
});

test('katkı verisi yoksa not düşer ve katkı 0 sayılır', () => {
  const r = computeScore({ profile: baseProfile, repos: [repo()], contrib: null, now: NOW });
  assert.equal(r.parts[0].val, 0);
  assert.ok(r.notes.some((n) => n.includes('Katkı verisi alınamadığı')));
});

test('boş bio uyarısı verir, fork depoları dil sayısına girmez', () => {
  const r = computeScore({
    profile: { ...baseProfile, bio: null },
    repos: [repo({ fork: true, language: 'Go' })],
    contrib: { contributions: [] },
    now: NOW,
  });
  assert.ok(r.notes.some((n) => n.includes('bio')));
  assert.equal(r.langs.length, 0);
});

test('grade boundaries remain stable', () => {
  assert.equal(grade(80), 'A');
  assert.equal(grade(79.9), 'B');
  assert.equal(grade(70), 'B');
  assert.equal(grade(60), 'C');
});

test('empty activity and repository lists are handled safely', () => {
  assert.deepEqual(streaks([]), { current: 0, longest: 0 });
  const result = computeScore({
    profile: { ...baseProfile, public_repos: 0 },
    repos: [],
    contrib: null,
    now: NOW,
  });
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.stats.total, 0);
  assert.equal(result.stats.current, 0);
  assert.equal(result.stats.longest, 0);
  assert.equal(result.parts.reduce((sum, part) => sum + part.val, 0), result.score);
});

test('empty and inactive streak histories return zeroes', () => {
  assert.deepEqual(streaks([]), { current: 0, longest: 0 });
  assert.deepEqual(streaks([{ count: 0 }, { count: 0 }]), { current: 0, longest: 0 });
});

test('current streak ignores trailing zero days but longest streak spans history', () => {
  assert.deepEqual(streaks([
    { count: 1 }, { count: 1 }, { count: 0 },
    { count: 2 }, { count: 1 }, { count: 0 },
  ]), { current: 2, longest: 2 });
});

test('a zero-activity day breaks the longest streak', () => {
  assert.deepEqual(streaks([
    { count: 1 }, { count: 1 }, { count: 0 },
    { count: 1 }, { count: 1 }, { count: 1 },
  ]), { current: 3, longest: 3 });
});

test('malformed contribution entries cannot corrupt totals or streaks', () => {
  const contributions = [null, {}, { count: '7' }, { count: Number.NaN }, { count: -1 }, { count: 2 }];
  assert.deepEqual(streaks(contributions), { current: 1, longest: 1 });
  const result = computeScore({
    profile: baseProfile,
    repos: [repo()],
    contrib: { contributions },
    now: NOW,
  });
  assert.equal(result.stats.total, 2);
  assert.equal(result.stats.current, 1);
  assert.equal(result.stats.longest, 1);
  assert.ok(Number.isFinite(result.score));
});
