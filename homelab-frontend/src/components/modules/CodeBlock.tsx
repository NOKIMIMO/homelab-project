import React from 'react';
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

  return (
    <div className="rounded-lg border border-base-content/10 overflow-hidden text-sm">
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
