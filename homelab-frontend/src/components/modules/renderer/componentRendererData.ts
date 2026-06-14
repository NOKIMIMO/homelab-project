import { isRendererRecord } from './componentRendererGuards';

export const extractBindingPayload = (value: unknown): unknown => {
  if (!isRendererRecord(value)) {
    return value;
  }

  const result = value.result;
  if (!isRendererRecord(result) || !('data' in result)) {
    return value;
  }

  return result.data;
};

export const extractListItems = (value: unknown): unknown[] => {
  const payload = extractBindingPayload(value);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRendererRecord(payload) && Array.isArray(payload.LIST)) {
    return payload.LIST;
  }

  return [];
};

export const resolveModalStateKey = (visible: unknown): string | null => {
  if (typeof visible !== 'string') {
    return null;
  }

  const exactStateMatch = visible.match(/^\s*\{\{\s*([a-zA-Z_$][\w$]*)\s*\}\}\s*$/);
  if (exactStateMatch?.[1]) {
    return exactStateMatch[1];
  }

  const notNullMatch = visible.match(
    /^\s*\{\{\s*([a-zA-Z_$][\w$]*)\s*(?:!==?|==?)\s*null\s*\}\}\s*$/,
  );
  if (notNullMatch?.[1]) {
    return notNullMatch[1];
  }

  return null;
};
