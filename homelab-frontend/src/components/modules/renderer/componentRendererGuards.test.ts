import { describe, it, expect } from 'vitest';
import {
  isRendererRecord,
  isSetStateAction,
  isBindingAction,
  hasSource,
  hasComponents,
  hasActions,
  hasContent,
  hasAction,
  hasDefaultClick,
} from './componentRendererGuards';

describe('isRendererRecord', () => {
  it('is true for plain objects and arrays, false for null and primitives', () => {
    expect(isRendererRecord({})).toBe(true);
    expect(isRendererRecord([])).toBe(true);
    expect(isRendererRecord(null)).toBe(false);
    expect(isRendererRecord('str')).toBe(false);
    expect(isRendererRecord(42)).toBe(false);
    expect(isRendererRecord(undefined)).toBe(false);
  });
});

describe('isSetStateAction', () => {
  it('is true only for objects with type === "setState"', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isSetStateAction({ type: 'setState' } as any)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isSetStateAction({ type: 'other' } as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isSetStateAction({ action: 'x' } as any)).toBe(false);
  });
});

describe('isBindingAction', () => {
  it('is true for objects carrying an "action" key', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isBindingAction({ action: 'listItems' } as any)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isBindingAction({ type: 'setState' } as any)).toBe(false);
  });
});

describe('structural component guards', () => {
  it('hasSource requires a non-null object source', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasSource({ source: { binding: 'x' } } as any)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasSource({ source: null } as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasSource({ type: 'List' } as any)).toBe(false);
  });

  it('detects presence of the components, actions, content, action and defaultClick keys', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasComponents({ components: [] } as any)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasActions({ actions: [] } as any)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasContent({ content: {} } as any)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasAction({ action: {} } as any)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasDefaultClick({ defaultClick: {} } as any)).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bare = { type: 'Header' } as any;
    expect(hasComponents(bare)).toBe(false);
    expect(hasActions(bare)).toBe(false);
    expect(hasContent(bare)).toBe(false);
    expect(hasAction(bare)).toBe(false);
    expect(hasDefaultClick(bare)).toBe(false);
  });
});
