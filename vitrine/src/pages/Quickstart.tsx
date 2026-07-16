import type { ReactNode } from 'react'
import CodeBlock from '../components/CodeBlock'
import FieldTable from '../components/FieldTable'
import {
  DOCKER_PULL,
  DOCKER_RUN,
  DOCKER_COMPOSE_ALL_IN_ONE_YML,
  ENV_ALL_IN_ONE,
} from '../data/snippets'
import { useLanguage, type Lang } from '../i18n/LanguageContext'

const TEXT: Record<
  Lang,
  {
    title: string
    intro: string
    columns: string[]
    rows: (string | ReactNode)[][]
    composeTitle: string
    composeIntro: string
    optionAtitle: string
    optionAintro: ReactNode
    optionAcmd: string
    optionBtitle: string
    optionBintro: ReactNode
    optionBenvNote: ReactNode
    optionBcmd: string
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
        "Identifiant Postgres, choisi librement -utilisé uniquement à la création de la base.",
      ],
      [<code>POSTGRES_PASSWORD</code>, 'Mot de passe Postgres associé.'],
      [
        <code>-v ./modules:/app_root/modules:ro</code>,
        <>
          Dossier hôte scanné par le backend (
          <code>HOMELAB_MODULES_SCAN_PATH=/app_root/modules</code>) ---
          déposez-y vos modules (<code>manifest.json</code> + fichiers).
          Remplacez <code>./modules</code> par un chemin absolu si la
          commande n'est pas lancée depuis le dossier du repo.
        </>,
      ],
    ],
    composeTitle: 'Alternative : Docker Compose',
    composeIntro:
      "Deux fichiers compose existent dans le repo, pour deux usages différents.",
    optionAtitle: 'Image tout-en-un, via Compose',
    optionAintro: (
      <>
        Équivalent à la commande <code>docker run</code> ci-dessus, sous
        forme de fichier -pratique pour figer la config. Placez ces deux
        fichiers à la racine du repo (ou d'un dossier vide) :
      </>
    ),
    optionAcmd: 'docker compose -f docker-compose.all-in-one.yml up -d',
    optionBtitle: 'B. Services séparés (backend / frontend / Postgres)',
    optionBintro: (
      <>
        Depuis un clone du repo -trois conteneurs distincts plutôt qu'une
        image unique. Utile pour du développement ou un déploiement où l'on
        veut scaler/redémarrer chaque service indépendamment.
      </>
    ),
    optionBenvNote: (
      <>
        <code>.env.production</code> n'est pas versionné -créez-le à la
        racine du repo avec ce contenu (adapté à vos identifiants) :
      </>
    ),
    optionBcmd: 'docker compose up --build',
  },
  en: {
    title: 'Quickstart',
    intro:
      'All-in-one Docker image (frontend + backend + Postgres), published on GitHub Container Registry.',
    columns: ['Parameter', 'Description'],
    rows: [
      [
        <code>POSTGRES_USER</code>,
        'Postgres username, chosen freely -only used when the database is first created.',
      ],
      [<code>POSTGRES_PASSWORD</code>, 'Matching Postgres password.'],
      [
        <code>-v ./modules:/app_root/modules:ro</code>,
        <>
          Host folder scanned by the backend (
          <code>HOMELAB_MODULES_SCAN_PATH=/app_root/modules</code>) -drop
          your modules there (<code>manifest.json</code> + files). Replace{' '}
          <code>./modules</code> with an absolute path if you're not running
          the command from the repo folder.
        </>,
      ],
    ],
    composeTitle: 'Alternative: Docker Compose',
    composeIntro: 'The repo has two compose files, for two different uses.',
    optionAtitle: 'All-in-one image, via Compose',
    optionAintro: (
      <>
        Equivalent to the <code>docker run</code> command above, as a file ---
        handy for pinning the config. Place these two files at the root of
        the repo (or any empty folder):
      </>
    ),
    optionAcmd: 'docker compose -f docker-compose.all-in-one.yml up -d',
    optionBtitle: 'B. Split services (backend / frontend / Postgres)',
    optionBintro: (
      <>
        From a clone of the repo -three separate containers instead of a
        single image. Useful for development, or a deployment where each
        service needs to scale/restart independently.
      </>
    ),
    optionBenvNote: (
      <>
        <code>.env.production</code> isn't checked into the repo -create it
        at the repo root with this content (adjusted to your credentials):
      </>
    ),
    optionBcmd: 'docker compose up --build',
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

      <h2 className="text-2xl font-semibold mt-10 mb-2">{t.composeTitle}</h2>
      {/* <p className="text-base-content/70 max-w-2xl">{t.composeIntro}</p> */}

      <h3 className="text-lg font-semibold mt-8 mb-2">{t.optionAtitle}</h3>
      <p className="text-base-content/70 max-w-2xl">{t.optionAintro}</p>
      <CodeBlock lang="yaml">{DOCKER_COMPOSE_ALL_IN_ONE_YML}</CodeBlock>
      <CodeBlock lang="bash">{ENV_ALL_IN_ONE}</CodeBlock>
      <CodeBlock lang="bash">{t.optionAcmd}</CodeBlock>

      {/* <h3 className="text-lg font-semibold mt-10 mb-2">{t.optionBtitle}</h3>
      <p className="text-base-content/70 max-w-2xl">{t.optionBintro}</p>
      <CodeBlock lang="yaml">{DOCKER_COMPOSE_SPLIT_YML}</CodeBlock> */}
      {/* <p className="text-base-content/70 max-w-2xl">{t.optionBenvNote}</p>
      <CodeBlock lang="bash">{ENV_PRODUCTION_EXAMPLE}</CodeBlock> */}
      {/* <CodeBlock lang="bash">{t.optionBcmd}</CodeBlock> */}
    </div>
  )
}

export default Quickstart
