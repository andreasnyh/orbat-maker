import { describe, expect, it } from 'vitest';
import { canonicalRankName, isSameRankName } from './useRanks';

describe('isSameRankName', () => {
  it('ignores case and surrounding whitespace', () => {
    expect(isSameRankName(' pvt. ', 'Pvt.')).toBe(true);
  });

  it('tells different names apart', () => {
    expect(isSameRankName('Pvt.', 'Cpl.')).toBe(false);
  });
});

describe('canonicalRankName', () => {
  const ranks = [{ id: 'r1', name: 'Pvt.' }];

  it('returns the stored spelling of a rank typed in another case', () => {
    expect(canonicalRankName(ranks, 'pvt.')).toBe('Pvt.');
  });

  it('keeps a new name as typed', () => {
    expect(canonicalRankName(ranks, 'Cpl.')).toBe('Cpl.');
  });
});
