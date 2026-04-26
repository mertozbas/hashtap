import { describe, it, expect } from 'vitest';
import { cn } from '../cn.js';

describe('cn (class name utility)', () => {
  it('joins simple strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('handles conditional object syntax', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });

  it('merges conflicting tailwind utilities (twMerge)', () => {
    // bg-red-500 should be overridden by bg-blue-500
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('preserves non-conflicting utilities', () => {
    const out = cn('p-4 text-white', 'rounded-lg');
    expect(out).toContain('p-4');
    expect(out).toContain('text-white');
    expect(out).toContain('rounded-lg');
  });
});
