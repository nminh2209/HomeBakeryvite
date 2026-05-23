import { afterEach, describe, expect, it, vi } from 'vitest';
import { optionalEnv, requireEnv } from './requireEnv';

describe('requireEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns trimmed value when set', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '  test-key  ');
    expect(requireEnv('VITE_FIREBASE_API_KEY')).toBe('test-key');
  });

  it('throws when missing', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    expect(() => requireEnv('VITE_FIREBASE_API_KEY')).toThrow(/Missing VITE_FIREBASE_API_KEY/);
  });
});

describe('optionalEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns undefined when empty', () => {
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', '');
    expect(optionalEnv('VITE_FIREBASE_MEASUREMENT_ID')).toBeUndefined();
  });
});
