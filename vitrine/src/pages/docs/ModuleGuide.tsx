import type { ReactNode } from 'react'
import { Link } from 'react-router'
import CodeBlock from '../../components/CodeBlock'
import FieldTable from '../../components/FieldTable'
import { BUILDER_REQUEST, MANIFEST_MANUAL, TASKS_XML } from '../../data/snippets'
import { useLanguage, type Lang } from '../../i18n/LanguageContext'

const TEXT: Record<
  Lang,
  {
    title: string
    section1Title: string
    section1Intro: ReactNode
    endpointsColumns: string[]
    endpointsRows: (string | ReactNode)[][]
    afterRequest: ReactNode
    section2Title: string
    section2Intro: ReactNode
    manifestColumns: string[]
    manifestRows: (string | ReactNode)[][]
    dataObjectIntro: ReactNode
    typingColumns: string[]
    typingRows: (string | ReactNode)[][]
    actionTypesTitle: string
    actionTypesIntro: ReactNode
    actionTypesColumns: string[]
    actionTypesRows: (string | ReactNode)[][]
  }
> = {
  fr: {
    title: 'Créer un module',
    section1Title: '1. Le créateur de module (recommandé)',
    section1Intro: (
      <>
        Le backend expose une API de création de module ---{' '}
        <code className="text-accent">ModuleBuilderService</code> --- qui
        génère <code>manifest.json</code>, le schéma <code>.xml</code> (le
        « dataobject ») et une page UI de base à partir d'une simple
        description JSON. Réservé au rôle <code>ADMIN</code>.
      </>
    ),
    endpointsColumns: ['Méthode', 'Route', 'Effet'],
    endpointsRows: [
      ['GET', '/api/admin/module-builder', 'Liste les modules créés via le builder'],
      ['GET', '/api/admin/module-builder/{id}/schema', 'Schéma (tables) d’un module'],
      ['POST', '/api/admin/module-builder', 'Crée un module --- génère manifest.json, .xml et la page UI'],
      ['PUT', '/api/admin/module-builder/{id}', 'Met à jour un module existant'],
      ['POST', '/api/admin/module-builder/{id}/tables/{table}/columns', 'Ajoute une colonne à une table'],
      ['DELETE', '/api/admin/module-builder/{id}?dropData=false', 'Supprime le module'],
    ],
    afterRequest: (
      <>
        Ce corps de requête suffit à générer <code>manifest.json</code>,{' '}
        <code>tasks.xml</code> et une page UI --- pas besoin d'écrire le JSON ou
        le XML à la main. <code>relations</code> et <code>uniqueTogether</code>{' '}
        sur une table suivent le même format que la section{' '}
        <Link to="/docs/orm" className="link link-primary">
          Cardinalité ORM
        </Link>
        .
      </>
    ),
    section2Title: '2. Format manuel --- pour un contrôle total',
    section2Intro: (
      <>
        Un module reste un simple dossier scanné au démarrage (
        <code>HOMELAB_MODULES_SCAN_PATH</code>). Il peut aussi être écrit à la
        main :
      </>
    ),
    manifestColumns: ['Champ', 'Requis', 'Description'],
    manifestRows: [
      ['id', 'oui', 'Identifiant unique du module'],
      ['name', 'oui', 'Nom affiché dans le dashboard'],
      ['version', 'non', 'Version libre (semver conseillé)'],
      ['icon', 'non', 'Icône SVG/image dans le dossier du module'],
      ['description', 'non', 'Texte court affiché dans le dashboard'],
      ['actions', 'oui', 'Groupes de fonctions exposées par le module'],
      ['dataObjects', 'non', 'Fichiers .xml de schéma utilisés par les actions'],
      ['page', 'non', 'Fichier JSON de l’interface --- absent = module API only'],
      [
        'uIFormat',
        'non',
        <>
          <code>JSON</code> (page pilotée par JSON) · <code>STANDALONE</code>{' '}
          (front autonome) · <code>API</code> (défaut, pas d'UI servie par le
          cœur)
        </>,
      ],
      ['dependencies', 'non', <><code>[{'{ moduleId, version }'}]</code> --- modules requis</>],
      ['permissions', 'non', 'Permissions déclarées, ex. read:module, write:module'],
    ],
    dataObjectIntro: (
      <>
        Le dataobject (<code>tasks.xml</code>) décrit le schéma SQL généré
        automatiquement :
      </>
    ),
    typingColumns: ['Typing', 'Type SQL'],
    typingRows: [
      ['string', 'VARCHAR / TEXT'],
      ['int / long', 'INTEGER / BIGINT'],
      ['boolean', 'BOOLEAN'],
      ['date / datetime', 'DATE / TIMESTAMP'],
      ['file', 'Stockage binaire (upload)'],
    ],
    actionTypesTitle: "Types d'actions backend",
    actionTypesIntro: (
      <>
        Déclarés dans <code>logic[].type</code> de chaque fonction --- un type
        standard ne nécessite aucun code Kotlin.
      </>
    ),
    actionTypesColumns: ['Type', 'Comportement'],
    actionTypesRows: [
      ['LIST', 'Retourne toutes les lignes de la table'],
      ['READ', <>Retourne une ligne filtrée par les paramètres <code>EQUAL</code></>],
      ['CREATE', 'Insère une nouvelle ligne avec les paramètres fournis'],
      ['DELETE', <>Supprime la/les lignes filtrées par les paramètres <code>EQUAL</code></>],
      ['UPLOAD_FILE', 'Upload un fichier binaire et crée une entrée en base'],
      ['GET_FILE', "Retourne le fichier binaire d'une entrée"],
      [
        'FETCH_EXTERNAL',
        <>
          Appelle une API HTTP externe, parse la réponse JSON, upsert le
          résultat en base. Lit <code>apiKey</code>/<code>baseUrl</code> depuis{' '}
          <code>params.json</code>.
        </>,
      ],
    ],
  },
  en: {
    title: 'Create a module',
    section1Title: '1. The module builder (recommended)',
    section1Intro: (
      <>
        The backend exposes a module-creation API ---{' '}
        <code className="text-accent">ModuleBuilderService</code> --- which
        generates <code>manifest.json</code>, the <code>.xml</code> schema
        (the "dataobject") and a basic UI page from a plain JSON description.
        Restricted to the <code>ADMIN</code> role.
      </>
    ),
    endpointsColumns: ['Method', 'Route', 'Effect'],
    endpointsRows: [
      ['GET', '/api/admin/module-builder', 'Lists modules created via the builder'],
      ['GET', '/api/admin/module-builder/{id}/schema', 'Schema (tables) of a module'],
      ['POST', '/api/admin/module-builder', 'Creates a module --- generates manifest.json, .xml and the UI page'],
      ['PUT', '/api/admin/module-builder/{id}', 'Updates an existing module'],
      ['POST', '/api/admin/module-builder/{id}/tables/{table}/columns', 'Adds a column to a table'],
      ['DELETE', '/api/admin/module-builder/{id}?dropData=false', 'Deletes the module'],
    ],
    afterRequest: (
      <>
        This request body is enough to generate <code>manifest.json</code>,{' '}
        <code>tasks.xml</code> and a UI page --- no need to hand-write the JSON
        or the XML. <code>relations</code> and <code>uniqueTogether</code> on
        a table follow the same format as the{' '}
        <Link to="/docs/orm" className="link link-primary">
          ORM cardinality
        </Link>{' '}
        section.
      </>
    ),
    section2Title: '2. Manual format --- for full control',
    section2Intro: (
      <>
        A module is still just a plain folder scanned at startup (
        <code>HOMELAB_MODULES_SCAN_PATH</code>). It can also be hand-written:
      </>
    ),
    manifestColumns: ['Field', 'Required', 'Description'],
    manifestRows: [
      ['id', 'yes', 'Unique module identifier'],
      ['name', 'yes', 'Name shown on the dashboard'],
      ['version', 'no', 'Free-form version (semver recommended)'],
      ['icon', 'no', 'SVG/image file in the module folder'],
      ['description', 'no', 'Short text shown on the dashboard'],
      ['actions', 'yes', 'Groups of functions exposed by the module'],
      ['dataObjects', 'no', 'XML schema files used by the actions'],
      ['page', 'no', 'JSON UI file --- absent = API-only module'],
      [
        'uIFormat',
        'no',
        <>
          <code>JSON</code> (JSON-driven page) · <code>STANDALONE</code>{' '}
          (standalone frontend) · <code>API</code> (default, no UI served by
          the core)
        </>,
      ],
      ['dependencies', 'no', <><code>[{'{ moduleId, version }'}]</code> --- required modules</>],
      ['permissions', 'no', 'Declared permissions, e.g. read:module, write:module'],
    ],
    dataObjectIntro: (
      <>
        The dataobject (<code>tasks.xml</code>) describes the SQL schema
        generated automatically:
      </>
    ),
    typingColumns: ['Typing', 'SQL type'],
    typingRows: [
      ['string', 'VARCHAR / TEXT'],
      ['int / long', 'INTEGER / BIGINT'],
      ['boolean', 'BOOLEAN'],
      ['date / datetime', 'DATE / TIMESTAMP'],
      ['file', 'Binary storage (upload)'],
    ],
    actionTypesTitle: 'Backend action types',
    actionTypesIntro: (
      <>
        Declared in each function's <code>logic[].type</code> --- a standard
        type needs no Kotlin code.
      </>
    ),
    actionTypesColumns: ['Type', 'Behavior'],
    actionTypesRows: [
      ['LIST', 'Returns every row in the table'],
      ['READ', <>Returns a row filtered by the <code>EQUAL</code> parameters</>],
      ['CREATE', 'Inserts a new row with the given parameters'],
      ['DELETE', <>Deletes the row(s) filtered by the <code>EQUAL</code> parameters</>],
      ['UPLOAD_FILE', 'Uploads a binary file and creates a database entry'],
      ['GET_FILE', "Returns a row's binary file"],
      [
        'FETCH_EXTERNAL',
        <>
          Calls an external HTTP API, parses the JSON response, upserts the
          result into the database. Reads <code>apiKey</code>/
          <code>baseUrl</code> from <code>params.json</code>.
        </>,
      ],
    ],
  },
}

function ModuleGuide() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">{t.title}</h1>

      <h2 className="text-2xl font-semibold mt-2 mb-2">{t.section1Title}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.section1Intro}</p>

      <FieldTable columns={t.endpointsColumns} rows={t.endpointsRows} />

      <CodeBlock lang="http">{BUILDER_REQUEST}</CodeBlock>

      <p className="text-base-content/70 max-w-2xl">{t.afterRequest}</p>

      <h2 className="text-2xl font-semibold mt-10 mb-2">{t.section2Title}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.section2Intro}</p>

      <FieldTable columns={t.manifestColumns} rows={t.manifestRows} />

      <CodeBlock lang="json">{MANIFEST_MANUAL}</CodeBlock>

      <p className="text-base-content/70 max-w-2xl">{t.dataObjectIntro}</p>

      <CodeBlock lang="xml">{TASKS_XML}</CodeBlock>

      <FieldTable columns={t.typingColumns} rows={t.typingRows} />

      <h2 className="text-2xl font-semibold mt-10 mb-2">{t.actionTypesTitle}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.actionTypesIntro}</p>

      <FieldTable columns={t.actionTypesColumns} rows={t.actionTypesRows} />
    </div>
  )
}

export default ModuleGuide
