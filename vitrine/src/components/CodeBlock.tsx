import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin'
import http from 'react-syntax-highlighter/dist/esm/languages/prism/http'
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('kotlin', kotlin)
SyntaxHighlighter.registerLanguage('http', http)
SyntaxHighlighter.registerLanguage('markup', markup)

const LANG_MAP: Record<string, string> = {
  xml: 'markup',
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const language = lang ? (LANG_MAP[lang] ?? lang) : 'text'

  return (
    <div className="rounded-lg border border-base-content/10 overflow-hidden my-4 text-sm">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e' }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono, ui-monospace, monospace)' } }}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  )
}

export default CodeBlock
