import type { ReactNode } from 'react'
import { Link } from 'react-router'
import CodeBlock from '../../components/CodeBlock'
import {
  PLUGIN_KOTLIN_EXAMPLE,
  PLUGIN_MANIFEST_SNIPPET,
  PLUGIN_SDK_DEPENDENCY_GRADLE,
  PLUGIN_SDK_DEPENDENCY_MAVEN,
  PLUGIN_SDK_INTERFACES,
  PLUGIN_SERVICE_FILE,
} from '../../data/snippets'
import { useLanguage, type Lang } from '../../i18n/LanguageContext'

const TEXT: Record<
  Lang,
  {
    title: string
    intro: ReactNode
    contractTitle: string
    contractIntro: ReactNode
    contextWarning: ReactNode
    exampleTitle: string
    exampleIntro: ReactNode
    buildTitle: string
    step1Title: string
    step1Intro: ReactNode
    step2Title: string
    step2Intro: ReactNode
    serviceFileNote: ReactNode
    step3Title: string
    step3Intro: ReactNode
    usageTitle: string
    usageIntro: ReactNode
  }
> = {
  fr: {
    title: 'Écrire un plugin',
    intro: (
      <>
        Un plugin ajoute un nouveau type d'action utilisable dans{' '}
        <code>logic[].type</code> --- au même titre que{' '}
        <code>CREATE</code>/<code>LIST</code>/<code>FETCH_EXTERNAL_GENERIC</code>
        ---, sans toucher au cœur. C'est un simple jar déposé dans un dossier
        scanné au démarrage, découvert via le{' '}
        <code>ServiceLoader</code> standard de Java.
      </>
    ),
    contractTitle: 'Le contrat',
    contractIntro: (
      <>
        Deux interfaces du <code>homelab-sdk</code> (voir la page{' '}
        <Link to="/docs/sdk" className="link link-primary">
          SDK
        </Link>
        ) : <code>LogicPlugin</code> déclare le nom du type et fournit
        l'instance de l'action ; <code>Action.execute(...)</code> reçoit les
        paramètres fusionnés de l'appel, la couche d'accès aux données{' '}
        <code>GenericTableLayer</code> (create/find/delete/update/
        updateByFilters) et la déclaration de la fonction telle qu'écrite dans
        le manifeste.
      </>
    ),
    contextWarning: (
      <>
        <strong>Piège</strong> : le SDK expose aussi{' '}
        <code>PluginContext</code>, mais il n'est aujourd'hui jamais transmis
        à <code>execute(...)</code> --- utilisez le paramètre{' '}
        <code>genericObject</code> directement, pas <code>PluginContext</code>.
      </>
    ),
    exampleTitle: 'Exemple réel : homelab-filemove-plugin',
    exampleIntro: (
      <>
        Un plugin du repo (<code>homelab-filemove-plugin/</code>) enregistre
        le type <code>FILE_MOVE</code> : il déplace le fichier d'une ligne
        existante vers un nouveau dossier puis met à jour la colonne{' '}
        <code>file</code> en base.
      </>
    ),
    buildTitle: 'Build et déploiement',
    step1Title: '1. Récupérer le SDK',
    step1Intro: (
      <>
        Le SDK est publié en tant qu'artefact Maven (<code>com.homelab:homelab-sdk</code>)
        sur les <strong>GitHub Releases</strong> du dépôt --- ajoutez-le comme dépendance :
      </>
    ),
    step2Title: '2. Enregistrement ServiceLoader (META-INF)',
    step2Intro: (
      <>
        Un fichier texte, sans extension, à placer dans{' '}
        <code>src/main/resources/META-INF/services/</code> : c'est lui qui
        permet au cœur de découvrir le plugin. Sans ce fichier, le jar est
        ignoré silencieusement.
      </>
    ),
    serviceFileNote: (
      <>
        Le <strong>nom du fichier</strong> est le nom qualifié complet de
        l'interface (<code>com.homelab.sdk.plugin.LogicPlugin</code>), sans
        extension --- c'est la convention <code>ServiceLoader</code> standard.
        Son <strong>contenu</strong> est une ligne par implémentation (nom
        qualifié complet de la classe).
      </>
    ),
    step3Title: '3. Build et déploiement',
    step3Intro: (
      <>
        Depuis le dossier du plugin : <code>./gradlew build</code> --- le jar
        sort dans <code>build/libs/&lt;nom&gt;-&lt;version&gt;.jar</code>.
        Copiez-le dans le dossier pointé par{' '}
        <code>HOMELAB_PLUGINS_SCAN_PATH</code> (défaut : <code>plugins/</code>,
        relatif au dossier de travail du backend) --- chargé via un{' '}
        <code>URLClassLoader</code> dédié au démarrage.
      </>
    ),
    usageTitle: 'Utiliser le type depuis un module',
    usageIntro: (
      <>
        Une fois le jar chargé, <code>FILE_MOVE</code> apparaît comme
        n'importe quel type builtin dans une étape <code>logic</code> ---
        depuis le{' '}
        <Link to="/docs/module" className="link link-primary">
          créateur de module
        </Link>{' '}
        (section « Fonctions personnalisées »), ou à la main dans un
        manifeste :
      </>
    ),
  },
  en: {
    title: 'Write a plugin',
    intro: (
      <>
        A plugin adds a new action type usable in <code>logic[].type</code>{' '}
        --- alongside <code>CREATE</code>/<code>LIST</code>/
        <code>FETCH_EXTERNAL_GENERIC</code> --- without touching the core.
        It's a plain jar dropped into a folder scanned at startup, discovered
        via Java's standard <code>ServiceLoader</code>.
      </>
    ),
    contractTitle: 'The contract',
    contractIntro: (
      <>
        Two interfaces from <code>homelab-sdk</code> (see the{' '}
        <Link to="/docs/sdk" className="link link-primary">
          SDK
        </Link>{' '}
        page): <code>LogicPlugin</code> declares the type name and provides
        the action instance; <code>Action.execute(...)</code> receives the
        call's merged params, the <code>GenericTableLayer</code> data-access
        layer (create/find/delete/update/updateByFilters), and the function's
        declaration as written in the manifest.
      </>
    ),
    contextWarning: (
      <>
        <strong>Gotcha</strong>: the SDK also exposes{' '}
        <code>PluginContext</code>, but it is never actually passed into{' '}
        <code>execute(...)</code> today --- use the <code>genericObject</code>{' '}
        parameter directly, not <code>PluginContext</code>.
      </>
    ),
    exampleTitle: 'Real example: homelab-filemove-plugin',
    exampleIntro: (
      <>
        A plugin in the repo (<code>homelab-filemove-plugin/</code>) registers
        the <code>FILE_MOVE</code> type: it moves an existing row's file to a
        new folder and then updates the row's <code>file</code> column.
      </>
    ),
    buildTitle: 'Build & deployment',
    step1Title: '1. Get the SDK',
    step1Intro: (
      <>
        The SDK is published as a Maven artifact (<code>com.homelab:homelab-sdk</code>)
        on the repo's <strong>GitHub Releases</strong> --- add it as a dependency:
      </>
    ),
    step2Title: '2. ServiceLoader registration (META-INF)',
    step2Intro: (
      <>
        A plain-text file, no extension, placed under{' '}
        <code>src/main/resources/META-INF/services/</code>: this is what lets
        the core discover the plugin. Without this file, the jar is silently
        ignored.
      </>
    ),
    serviceFileNote: (
      <>
        The <strong>file name</strong> is the interface's fully-qualified
        name (<code>com.homelab.sdk.plugin.LogicPlugin</code>), no extension
        --- the standard <code>ServiceLoader</code> convention. Its{' '}
        <strong>content</strong> is one line per implementation
        (fully-qualified class name).
      </>
    ),
    step3Title: '3. Build & deploy',
    step3Intro: (
      <>
        From the plugin's folder: <code>./gradlew build</code> --- the jar is
        produced at <code>build/libs/&lt;name&gt;-&lt;version&gt;.jar</code>.
        Copy it into the folder pointed to by{' '}
        <code>HOMELAB_PLUGINS_SCAN_PATH</code> (default: <code>plugins/</code>,
        relative to the backend's working directory) --- loaded via a
        dedicated <code>URLClassLoader</code> at startup.
      </>
    ),
    usageTitle: 'Using the type from a module',
    usageIntro: (
      <>
        Once the jar is loaded, <code>FILE_MOVE</code> shows up like any
        builtin type in a <code>logic</code> step --- from the{' '}
        <Link to="/docs/module" className="link link-primary">
          module builder
        </Link>{' '}
        ("Custom functions" section), or by hand in a manifest:
      </>
    ),
  },
}

function PluginGuide() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">{t.title}</h1>
      <p className="text-base-content/70 max-w-2xl">{t.intro}</p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">{t.contractTitle}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.contractIntro}</p>

      <CodeBlock lang="kotlin">{PLUGIN_SDK_INTERFACES}</CodeBlock>

      <div className="alert alert-warning text-sm my-4 max-w-2xl">
        <span>{t.contextWarning}</span>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-2">{t.exampleTitle}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.exampleIntro}</p>

      <CodeBlock lang="kotlin">{PLUGIN_KOTLIN_EXAMPLE}</CodeBlock>

      <h2 className="text-2xl font-semibold mt-8 mb-2">{t.buildTitle}</h2>

      <h3 className="text-lg font-semibold mt-6 mb-2">{t.step1Title}</h3>
      <p className="text-base-content/70 max-w-2xl">{t.step1Intro}</p>
      <CodeBlock lang="xml">{PLUGIN_SDK_DEPENDENCY_MAVEN}</CodeBlock>
      <CodeBlock lang="kotlin">{PLUGIN_SDK_DEPENDENCY_GRADLE}</CodeBlock>

      <h3 className="text-lg font-semibold mt-6 mb-2">{t.step2Title}</h3>
      <p className="text-base-content/70 max-w-2xl">{t.step2Intro}</p>
      <CodeBlock lang="bash">{PLUGIN_SERVICE_FILE}</CodeBlock>
      <p className="text-base-content/70 max-w-2xl">{t.serviceFileNote}</p>

      <h3 className="text-lg font-semibold mt-6 mb-2">{t.step3Title}</h3>
      <p className="text-base-content/70 max-w-2xl">{t.step3Intro}</p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">{t.usageTitle}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.usageIntro}</p>

      <CodeBlock lang="json">{PLUGIN_MANIFEST_SNIPPET}</CodeBlock>
    </div>
  )
}

export default PluginGuide
