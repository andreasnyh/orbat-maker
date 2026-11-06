import { describe, expect, it } from 'vitest';
import type { Assignment, Template } from '../types';
import { liveAssignments } from './collections';

const template = {
  groups: [{ slots: [{ id: 's1' }] }, { slots: [{ id: 's2' }] }],
} as unknown as Template;

const a = (slotId: string): Assignment => ({ slotId, personId: 'p' });

describe('liveAssignments', () => {
  it('keeps assignments whose slot exists in any group', () => {
    expect(liveAssignments([a('s1'), a('s2')], template)).toHaveLength(2);
  });

  it('drops assignments whose slot is gone', () => {
    expect(liveAssignments([a('s1'), a('gone')], template)).toEqual([a('s1')]);
  });

  it('returns nothing without a template', () => {
    expect(liveAssignments([a('s1')], undefined)).toEqual([]);
  });
});
