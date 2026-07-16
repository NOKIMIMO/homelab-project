import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('json', json);

export interface CodeBlockProps {
  lang?: string;
  sourceData?: unknown;
  loading?: boolean;
  error?: string;
}

const prettify = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

// The backend always answers HTTP 200 even when the underlying action itself failed (e.g.
// FETCH_EXTERNAL_GENERIC returning {error: "..."}) - that failure only shows up as a nested
// "error" field somewhere in the JSON body, not as a fetch-level error prop. Walk a few levels
// deep (module responses are wrapped a few layers: result.data.<TYPE>.error) to surface it.
const findEmbeddedError = (value: unknown, depth = 4): string | null => {
  if (depth < 0 || value == null || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findEmbeddedError(item, depth - 1);
      if (found) return found;
    }
    return null;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
  for (const key of Object.keys(obj)) {
    const found = findEmbeddedError(obj[key], depth - 1);
    if (found) return found;
  }
  return null;
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ lang = 'json', sourceData, loading = false, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-40 bg-base-200 rounded-xl">
        <span className="loading loading-spinner text-primary"></span>
        <p className="ml-2">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center w-full h-40 bg-error/10 text-error rounded-xl">
        <p>{error}</p>
      </div>
    );
  }

  const content = prettify(sourceData);

  if (!content) {
    return (
      <div className="flex justify-center items-center w-full h-40 bg-base-200 rounded-xl text-base-content/50">
        <p>Aucune donnée</p>
      </div>
    );
  }

  const embeddedError = findEmbeddedError(sourceData);

  return (
    <div className={`rounded-lg border overflow-hidden text-sm ${embeddedError ? 'border-error/40' : 'border-base-content/10'}`}>
      {embeddedError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-error/10 text-error text-xs border-b border-error/20">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="break-all">{embeddedError}</span>
        </div>
      )}
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e' }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono, ui-monospace, monospace)' } }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
CodeBlock.displayName = 'CodeBlock';
