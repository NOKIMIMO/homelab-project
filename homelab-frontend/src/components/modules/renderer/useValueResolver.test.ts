import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useValueResolver } from './useValueResolver';
import type { RendererContext } from '../types';

// The resolver only walks the scope like a plain record, so a loose cast is enough here.
const scope = {
  user: { name: 'Alice', age: 30 },
  count: 3,
  same: 3,
  missing: null,
} as unknown as RendererContext;

function setup() {
  return renderHook(() => useValueResolver(scope)).result.current;
}

describe('resolveExpression', () => {
  it('resolves a plain dotted path', () => {
    const { resolveExpression } = setup();
    expect(resolveExpression('user.name', scope)).toBe('Alice');
    expect(resolveExpression('count', scope)).toBe(3);
  });

  it('returns undefined for an unknown path', () => {
    const { resolveExpression } = setup();
    expect(resolveExpression('user.email', scope)).toBeUndefined();
  });

  it('evaluates != null and == null checks', () => {
    const { resolveExpression } = setup();
    expect(resolveExpression('user != null', scope)).toBe(true);
    expect(resolveExpression('missing != null', scope)).toBe(false);
    expect(resolveExpression('missing == null', scope)).toBe(true);
    expect(resolveExpression('user !== null', scope)).toBe(true);
  });

  it('evaluates equality between two paths', () => {
    const { resolveExpression } = setup();
    expect(resolveExpression('count == same', scope)).toBe(true);
    expect(resolveExpression('count === same', scope)).toBe(true);
    expect(resolveExpression('count != user.age', scope)).toBe(true);
    expect(resolveExpression('count === user.age', scope)).toBe(false);
  });

  it('returns undefined for an unparseable expression', () => {
    const { resolveExpression } = setup();
    expect(resolveExpression('1 + 1', scope)).toBeUndefined();
  });
});

describe('resolveValue', () => {
  it('returns non-string values untouched', () => {
    const { resolveValue } = setup();
    expect(resolveValue(42)).toBe(42);
    expect(resolveValue(true)).toBe(true);
  });

  it('returns the native type for an exact {{ }} match', () => {
    const { resolveValue } = setup();
    expect(resolveValue('{{count}}')).toBe(3);
    expect(resolveValue('{{user.name}}')).toBe('Alice');
  });

  it('keeps the original string when an exact match resolves to undefined', () => {
    const { resolveValue } = setup();
    expect(resolveValue('{{user.email}}')).toBe('{{user.email}}');
  });

  it('interpolates values inside a larger string', () => {
    const { resolveValue } = setup();
    expect(resolveValue('Hi {{user.name}}, count={{count}}')).toBe('Hi Alice, count=3');
  });

  it('leaves an unresolved token in place during interpolation', () => {
    const { resolveValue } = setup();
    expect(resolveValue('X={{nope}}')).toBe('X={{nope}}');
  });

  it('returns strings without any placeholder unchanged', () => {
    const { resolveValue } = setup();
    expect(resolveValue('plain text')).toBe('plain text');
  });
});

describe('resolveRecord', () => {
  it('resolves every value of a record', () => {
    const { resolveRecord } = setup();
    expect(resolveRecord({ a: '{{count}}', b: 'literal', c: '{{user.name}}' })).toEqual({
      a: 3,
      b: 'literal',
      c: 'Alice',
    });
  });
});
