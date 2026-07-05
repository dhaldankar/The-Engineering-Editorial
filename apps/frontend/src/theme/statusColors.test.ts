import { describe, it, expect } from 'vitest';
import { getStatusColor } from './statusColors';

describe('getStatusColor', () => {
  it('maps each of the four wireframe accent kinds to a distinct, defined color', () => {
    const kinds = ['success', 'warning', 'danger', 'research'] as const;
    const colors = kinds.map(getStatusColor);
    colors.forEach((c) => expect(c).toBeTruthy());
    expect(new Set(colors).size).toBe(kinds.length);
  });
});
