function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return (
    <pre
      className="mockup-code bg-base-300 text-base-content overflow-x-auto text-sm my-4"
      data-lang={lang}
    >
      <code className="px-6 whitespace-pre">{children.trim()}</code>
    </pre>
  )
}

export default CodeBlock
