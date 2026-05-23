import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('strips spaces and punctuation', () => {
    expect(normalizePhone('0901 234-567')).toBe('0901234567');
  });

  it('converts +84 to leading 0', () => {
    expect(normalizePhone('+84901234567')).toBe('0901234567');
  });

  it('converts 84 prefix to leading 0', () => {
    expect(normalizePhone('84901234567')).toBe('0901234567');
  });

  it('keeps local numbers starting with 0', () => {
    expect(normalizePhone('0901234567')).toBe('0901234567');
  });

  it('handles parentheses', () => {
    expect(normalizePhone('(090) 123-4567')).toBe('0901234567');
  });
});
