const TONE_CLASS: Record<'beta' | 'todo', string> = {
  beta: 'badge-warning',
  todo: 'badge-ghost',
}

function Badge({ tone, children }: { tone: 'beta' | 'todo'; children: string }) {
  return <span className={`badge ${TONE_CLASS[tone]} badge-sm font-medium`}>{children}</span>
}

export default Badge
