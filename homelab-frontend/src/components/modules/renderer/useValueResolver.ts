import React from 'react';
import type { RendererContext } from './../types';

export const useValueResolver = (renderContext: RendererContext) => {
  const resolveExpression = React.useCallback(
    (expression: string, scope: RendererContext): unknown => {
      // not-null / null checks: `varName != null`, `varName !== null`, etc.
      const nullCheckMatch = expression.match(
        /^([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*(!==?|==?)\s*null$/,
      );
      if (nullCheckMatch) {
        const [, key, operator] = nullCheckMatch;
        const cur = resolvePath(key, scope);
        return operator.startsWith('!') ? cur != null : cur == null;
      }

      const eqMatch = expression.match(
        /^([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*(==|===|!=|!==)\s*([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)$/,
      );
      if (eqMatch) {
        const [, left, op, right] = eqMatch;
        const a = resolvePath(left, scope);
        const b = resolvePath(right, scope);
        switch (op) {
          case '==':  return a == b;
          case '===': return a === b;
          case '!=':  return a != b;
          case '!==': return a !== b;
          default:    return false;
        }
      }

      // plain identifier or dotted path: `foo`, `foo.bar.baz`
      const identifierMatch = expression.match(/^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/);
      if (identifierMatch) {
        return resolvePath(expression, scope);
      }

      return undefined;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const resolveValue = React.useCallback(
    (value: unknown, scope: RendererContext = renderContext): unknown => {
      if (typeof value === 'string' && value.includes('{{')) {
        // exact match --- return the native type, not a string
        const exactMatch = value.match(/^\{\{([^}]+)\}\}$/);
        if (exactMatch?.[1]) {
          const resolved = resolveExpression(exactMatch[1].trim(), scope);
          return resolved !== undefined ? resolved : value;
        }

        // partial interpolation --- always returns a string
        return value.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
          const resolved = resolveExpression(key.trim(), scope);
          return resolved !== undefined ? String(resolved) : match;
        });
      }
      return value;
    },
    [renderContext, resolveExpression],
  );

  const resolveRecord = React.useCallback(
    (value: Record<string, unknown>): Record<string, unknown> =>
      Object.entries(value).reduce<Record<string, unknown>>(
        (acc, [key, entry]) => ({ ...acc, [key]: resolveValue(entry) }),
        {},
      ),
    [resolveValue],
  );

  return { resolveExpression, resolveValue, resolveRecord };
};

const resolvePath = (path: string, scope: unknown): unknown => {
  const parts = path.split('.');
  let cur = scope;
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
};
