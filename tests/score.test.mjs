import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, grade, streaks } from '../assets/score.js';

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
