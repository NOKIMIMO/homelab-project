import type { ReactNode } from 'react'
import CodeBlock from '../components/CodeBlock'
import FieldTable from '../components/FieldTable'
import { DOCKER_PULL, DOCKER_RUN } from '../data/snippets'
import { useLanguage, type Lang } from '../i18n/LanguageContext'

const TEXT: Record<
  Lang,
  {
    title: string
    intro: string
    columns: string[]
    rows: (string | ReactNode)[][]
  }
> = {
  fr: {
    title: 'Démarrage rapide',
    intro:
      'Image Docker « tout-en-un » (frontend + backend + Postgres) publiée sur GitHub Container Registry.',
    columns: ['Paramètre', 'Description'],
    rows: [
      [
        <code>POSTGRES_USER</code>,
        "Identifiant Postgres, choisi librement — utilisé uniquement à la création de la base.",
      ],
      [<code>POSTGRES_PASSWORD</code>, 'Mot de passe Postgres associé.'],
      [
        <code>-v ./modules:/app_root/modules:ro</code>,
        <>
          Dossier hôte scanné par le backend (
          <code>HOMELAB_MODULES_SCAN_PATH=/app_root/modules</code>) —
          déposez-y vos modules (<code>manifest.json</code> + fichiers).
          Remplacez <code>./modules</code> par un chemin absolu si la
          commande n'est pas lancée depuis le dossier du repo.
        </>,
      ],
    ],
  },
  en: {
    title: 'Quickstart',
    intro:
      'All-in-one Docker image (frontend + backend + Postgres), published on GitHub Container Registry.',
    columns: ['Parameter', 'Description'],
    rows: [
      [
        <code>POSTGRES_USER</code>,
        'Postgres username, chosen freely — only used when the database is first created.',
      ],
      [<code>POSTGRES_PASSWORD</code>, 'Matching Postgres password.'],
      [
        <code>-v ./modules:/app_root/modules:ro</code>,
        <>
          Host folder scanned by the backend (
          <code>HOMELAB_MODULES_SCAN_PATH=/app_root/modules</code>) — drop
          your modules there (<code>manifest.json</code> + files). Replace{' '}
          <code>./modules</code> with an absolute path if you're not running
          the command from the repo folder.
        </>,
      ],
    ],
  },
}

function Quickstart() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-3">{t.title}</h1>
      <p className="text-base-content/70 max-w-2xl">{t.intro}</p>

      <CodeBlock lang="bash">{DOCKER_PULL}</CodeBlock>
      <CodeBlock lang="bash">{DOCKER_RUN}</CodeBlock>

      <FieldTable columns={t.columns} rows={t.rows} />
    </div>
  )
}

export default Quickstart
