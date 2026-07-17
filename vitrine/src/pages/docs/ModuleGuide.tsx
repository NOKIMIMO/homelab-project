import type { ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Link } from 'react-router'
import CodeBlock from '../../components/CodeBlock'
import FieldTable from '../../components/FieldTable'
import {
  BUILDER_REQUEST,
  CUSTOM_FUNCTION_CHAIN_EXAMPLE,
  MANIFEST_MANUAL,
  MAP_JSON_MAPPING_FILE,
  TASKS_XML,
} from '../../data/snippets'
import { useLanguage, type Lang } from '../../i18n/LanguageContext'

const EXAMPLE_MODULES_RELEASE_TAG = 'modV1'
const EXAMPLE_MODULES = ['photos', 'reader', 'weather'].map(id => ({
  id,
  url: `https://github.com/NOKIMIMO/homelab-project/releases/download/${EXAMPLE_MODULES_RELEASE_TAG}/${id}.zip`,
}))

const TEXT: Record<
  Lang,
  {
    title: string
    examplesTitle: string
    examplesIntro: ReactNode
    section1Title: string
    section1Intro: ReactNode
    endpointsColumns: string[]
    endpointsRows: (string | ReactNode)[][]
    standaloneApiNote: ReactNode
    afterRequest: ReactNode
    builderExtrasIntro: ReactNode
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
    customFunctionsTitle: string
    customFunctionsIntro: ReactNode
    customFunctionsChainNote: ReactNode
    mappingFileIntro: ReactNode
  }
> = {
  fr: {
    title: 'Créer un module',
    examplesTitle: 'Exemples prêts à l’emploi',
    examplesIntro: (
      <>
        Trois modules exportés (<code>.zip</code>) --- galerie photo, lecteur
        de séries (UI standalone) et météo --- à télécharger puis installer
        tels quels via le bouton « Installer un module (.zip) » du panel
        admin, pour voir un module fonctionnel avant d'en créer un soi-même.
      </>
    ),
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
      ['POST', '/api/admin/module-builder/{id}/icon', 'Envoie une icône personnalisée (png/jpg/svg/webp/gif, ≤2 Mo)'],
      [
        'POST',
        '/api/admin/module-builder/{id}/ui-page',
        <>
          Remplace la page UI auto-générée par un fichier JSON écrit à la
          main --- ne sera plus régénérée automatiquement ensuite
        </>,
      ],
      [
        'POST',
        '/api/admin/module-builder/{id}/ui-build',
        <>
          Installe un frontend complet déjà construit (<code>.zip</code>,
          extrait dans <code>dist/</code>) --- bascule le module en{' '}
          <code>uIFormat: "STANDALONE"</code>
        </>,
      ],
      ['DELETE', '/api/admin/module-builder/{id}?dropData=false', 'Supprime le module'],
      ['PUT', '/api/admin/module-settings/{id}', <>Réserve l'écriture et/ou la suppression du module aux administrateurs (par défaut : ouvert à tout utilisateur authentifié)</>],
      ['POST', '/api/modules/scan', 'Recharge tous les modules depuis le disque (bouton « Rescanner »)'],
    ],
    standaloneApiNote: (
      <>
        <strong>Piège fréquent (uIFormat: "STANDALONE")</strong> : le frontend
        uploadé est chargé dans une iframe, mais servi depuis une origine qui
        change selon le déploiement (port 80 en image tout-en-un, port 8080
        en services séparés, IP du LAN, domaine derrière un reverse proxy...).
        Ne codez jamais en dur une URL absolue comme{' '}
        <code>http://localhost:8080</code> dans son code --- utilisez des
        chemins <strong>relatifs</strong>, au format{' '}
        <code>/api/&lt;id&gt;/&lt;fonction&gt;</code> (ex.{' '}
        <code>/api/reader/listSeries</code>), qui se résolvent automatiquement
        contre l'origine réelle de la page --- exactement comme{' '}
        <code>homelab-frontend</code> le fait déjà lui-même.
      </>
    ),
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
    builderExtrasIntro: (
      <>
        Le formulaire du créateur de module couvre aussi, sans appel API
        manuel : dépendances (choix parmi les modules déjà installés),
        upload d'icône, et les deux réglages d'accès écriture/suppression
        décrits ci-dessus.
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
      ['dependencies', 'non', <><code>[{'{ moduleId, version }'}]</code> --- modules requis, doivent déjà exister sur l'instance</>],
      [
        'permissions',
        'non',
        <>
          Liste informative <code>read/write/delete:&lt;id&gt;</code> ---{' '}
          <strong>non appliquée</strong> par le moteur d'autorisation. Le
          contrôle d'accès réel se fait via <code>PUT /api/admin/module-settings/{'{id}'}</code>{' '}
          (écriture/suppression réservées aux admins ou non).
        </>,
      ],
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
      ['UPDATE', <>Met à jour la/les lignes filtrées par les paramètres <code>EQUAL</code> avec le reste des paramètres</>],
      ['DELETE', <>Supprime la/les lignes filtrées par les paramètres <code>EQUAL</code></>],
      ['UPLOAD_FILE', 'Upload un fichier binaire et crée une entrée en base'],
      ['GET_FILE', "Retourne le fichier binaire d'une entrée"],
      [
        'FETCH_EXTERNAL',
        <>
          Appelle l'API OpenWeatherMap (logique codée en dur, cf. module{' '}
          <code>weather</code>), parse la réponse, upsert le résultat en
          base. Lit <code>apiKey</code>/<code>baseUrl</code>/<code>units</code> depuis{' '}
          <code>params.json</code>, méthode HTTP configurable via{' '}
          <code>params.method</code> (défaut <code>GET</code>).
        </>,
      ],
      [
        'FETCH_EXTERNAL_GENERIC',
        <>
          Équivalent générique et réutilisable pour n'importe quelle API :{' '}
          <code>urlTemplate</code> (placeholders <code>{'{nom}'}</code>),{' '}
          <code>method</code>, <code>responseMapping</code> (colonne → chemin
          JSON) et <code>upsertKey</code> optionnel. Sans{' '}
          <code>responseMapping</code>, retourne le JSON brut sans écrire en
          base --- utile enchaîné avec <code>MAP_JSON</code> ci-dessous.
        </>,
      ],
      [
        'MAP_JSON',
        <>
          Mappe le résultat de l'étape <em>précédente</em> vers des colonnes,
          via un fichier dédié <code>&lt;nomFonction&gt;.mapping.json</code>{' '}
          (même forme que <code>responseMapping</code>/<code>upsertKey</code>{' '}
          ci-dessus). Voir « Fonctions personnalisées » plus bas.
        </>,
      ],
      [
        <em key="plugin">custom (plugin)</em>,
        <>
          Types additionnels enregistrés par un plugin ---{' '}
          <Link to="/docs/plugin" className="link link-primary">
            voir Écrire un plugin
          </Link>
          .
        </>,
      ],
    ],
    customFunctionsTitle: 'Fonctions personnalisées : enchaîner des actions',
    customFunctionsIntro: (
      <>
        Depuis le créateur de module, une table peut déclarer des « Fonctions
        personnalisées » : une séquence ordonnée d'étapes, chacune choisissant
        un type d'action parmi ceux réellement disponibles (builtins +
        plugins, <code>GET /api/modules/actions</code>), avec ses propres
        paramètres fixes.
      </>
    ),
    customFunctionsChainNote: (
      <>
        Chaque étape reçoit le résultat de la précédente via le paramètre
        réservé <code>_previousResult</code> (façon pipeline Laravel) --- ce
        qui permet par exemple d'enchaîner un appel externe brut (sans{' '}
        <code>responseMapping</code>) avec <code>MAP_JSON</code> :
      </>
    ),
    mappingFileIntro: (
      <>
        Avec le fichier de mapping dédié <code>callApi.mapping.json</code>{' '}
        dans le dossier du module :
      </>
    ),
  },
  en: {
    title: 'Create a module',
    examplesTitle: 'Ready-to-use examples',
    examplesIntro: (
      <>
        Three exported modules (<code>.zip</code>) --- a photo gallery, a
        series reader (standalone UI), and weather --- to download and
        install as-is via the "Install a module (.zip)" button in the admin
        panel, to see a working module before building your own.
      </>
    ),
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
      ['POST', '/api/admin/module-builder/{id}/icon', 'Uploads a custom icon (png/jpg/svg/webp/gif, ≤2MB)'],
      [
        'POST',
        '/api/admin/module-builder/{id}/ui-page',
        <>
          Replaces the auto-generated UI page with a hand-written JSON file ---
          it won't be regenerated automatically afterwards
        </>,
      ],
      [
        'POST',
        '/api/admin/module-builder/{id}/ui-build',
        <>
          Installs a complete pre-built frontend (<code>.zip</code>, extracted
          into <code>dist/</code>) --- switches the module to{' '}
          <code>uIFormat: "STANDALONE"</code>
        </>,
      ],
      ['DELETE', '/api/admin/module-builder/{id}?dropData=false', 'Deletes the module'],
      ['PUT', '/api/admin/module-settings/{id}', <>Restricts writes and/or deletes on the module to admins (default: open to any authenticated user)</>],
      ['POST', '/api/modules/scan', 'Reloads every module from disk (the "Rescan" button)'],
    ],
    standaloneApiNote: (
      <>
        <strong>Common gotcha (uIFormat: "STANDALONE")</strong>: the uploaded
        frontend is loaded in an iframe, but served from an origin that
        changes depending on the deployment (port 80 in the all-in-one image,
        port 8080 in split services, a LAN IP, a domain behind a reverse
        proxy...). Never hardcode an absolute URL like{' '}
        <code>http://localhost:8080</code> in its code --- use{' '}
        <strong>relative</strong> paths, in the form{' '}
        <code>/api/&lt;id&gt;/&lt;function&gt;</code> (e.g.{' '}
        <code>/api/reader/listSeries</code>), which resolve automatically
        against the page's real origin --- exactly like{' '}
        <code>homelab-frontend</code> already does itself.
      </>
    ),
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
    builderExtrasIntro: (
      <>
        The module-builder form also covers, without a manual API call:
        dependencies (picked from already-installed modules), icon upload,
        and the two write/delete access toggles described above.
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
      ['dependencies', 'no', <><code>[{'{ moduleId, version }'}]</code> --- required modules, must already exist on the instance</>],
      [
        'permissions',
        'no',
        <>
          Informative <code>read/write/delete:&lt;id&gt;</code> list ---{' '}
          <strong>not enforced</strong> by the authorization engine. Real
          access control is via <code>PUT /api/admin/module-settings/{'{id}'}</code>{' '}
          (writes/deletes restricted to admins or not).
        </>,
      ],
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
      ['UPDATE', <>Updates the row(s) filtered by the <code>EQUAL</code> parameters with the rest of the parameters</>],
      ['DELETE', <>Deletes the row(s) filtered by the <code>EQUAL</code> parameters</>],
      ['UPLOAD_FILE', 'Uploads a binary file and creates a database entry'],
      ['GET_FILE', "Returns a row's binary file"],
      [
        'FETCH_EXTERNAL',
        <>
          Calls the OpenWeatherMap API (hardcoded logic, see the{' '}
          <code>weather</code> module), parses the response, upserts the
          result into the database. Reads <code>apiKey</code>/
          <code>baseUrl</code>/<code>units</code> from <code>params.json</code>,
          HTTP method configurable via <code>params.method</code> (default{' '}
          <code>GET</code>).
        </>,
      ],
      [
        'FETCH_EXTERNAL_GENERIC',
        <>
          Generic, reusable equivalent for any API: <code>urlTemplate</code>{' '}
          (<code>{'{name}'}</code> placeholders), <code>method</code>,{' '}
          <code>responseMapping</code> (column → JSON path) and an optional{' '}
          <code>upsertKey</code>. Without <code>responseMapping</code>,
          returns the raw JSON without writing to the database --- useful
          chained with <code>MAP_JSON</code> below.
        </>,
      ],
      [
        'MAP_JSON',
        <>
          Maps the <em>previous</em> step's result into columns, via a
          dedicated <code>&lt;functionName&gt;.mapping.json</code> file (same
          shape as <code>responseMapping</code>/<code>upsertKey</code> above).
          See "Custom functions" below.
        </>,
      ],
      [
        <em key="plugin">custom (plugin)</em>,
        <>
          Additional types registered by a plugin ---{' '}
          <Link to="/docs/plugin" className="link link-primary">
            see Write a plugin
          </Link>
          .
        </>,
      ],
    ],
    customFunctionsTitle: 'Custom functions: chaining actions',
    customFunctionsIntro: (
      <>
        From the module builder, a table can declare "Custom functions": an
        ordered sequence of steps, each picking an action type from those
        actually available (builtins + plugins, <code>GET /api/modules/actions</code>),
        with its own static parameters.
      </>
    ),
    customFunctionsChainNote: (
      <>
        Each step receives the previous one's result via the reserved{' '}
        <code>_previousResult</code> parameter (Laravel-pipeline style) ---
        which lets you e.g. chain a raw external call (no{' '}
        <code>responseMapping</code>) with <code>MAP_JSON</code>:
      </>
    ),
    mappingFileIntro: (
      <>
        With the dedicated mapping file <code>callApi.mapping.json</code> in
        the module's folder:
      </>
    ),
  },
}

function ModuleGuide() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">{t.title}</h1>

      <h2 className="text-2xl font-semibold mt-2 mb-2">{t.examplesTitle}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.examplesIntro}</p>
      <div className="flex flex-wrap gap-3 my-4">
        {EXAMPLE_MODULES.map(m => (
          <a key={m.id} href={m.url} className="btn btn-outline btn-sm gap-2">
            <Download size={14} /> {m.id}.zip
          </a>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-2">{t.section1Title}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.section1Intro}</p>

      <FieldTable columns={t.endpointsColumns} rows={t.endpointsRows} />

      <div className="alert alert-warning text-sm my-4 max-w-2xl">
        <span>{t.standaloneApiNote}</span>
      </div>

      <CodeBlock lang="http">{BUILDER_REQUEST}</CodeBlock>

      <p className="text-base-content/70 max-w-2xl">{t.afterRequest}</p>
      <p className="text-base-content/70 max-w-2xl mt-2">{t.builderExtrasIntro}</p>

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

      <h2 className="text-2xl font-semibold mt-10 mb-2">{t.customFunctionsTitle}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.customFunctionsIntro}</p>
      <p className="text-base-content/70 max-w-2xl mt-2">{t.customFunctionsChainNote}</p>

      <CodeBlock lang="json">{CUSTOM_FUNCTION_CHAIN_EXAMPLE}</CodeBlock>

      <p className="text-base-content/70 max-w-2xl">{t.mappingFileIntro}</p>

      <CodeBlock lang="json">{MAP_JSON_MAPPING_FILE}</CodeBlock>
    </div>
  )
}

export default ModuleGuide
