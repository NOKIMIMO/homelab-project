import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Terminal,
  BookOpen,
  Package,
  Database,
  LayoutTemplate,
  Activity,
  ShieldCheck,
  Sliders,
  Film,
  Image,
  BookOpenText,
  CloudSun,
  ScrollText,
  Users,
  Settings2,
  ArrowRight,
  Download,
} from 'lucide-react'
import { useLanguage, type Lang } from '../i18n/LanguageContext'

const FLOW = ['UI JSON', 'ComponentRenderer', 'POST /api/{id}/{fn}', 'AppletController', 'ActionFactory', 'SQL / API']

type Feature = { icon: ComponentType<{ size?: number; className?: string }>; title: string; body: string }
type Step = { title: string; body: ReactNode }
type ModuleCard = { icon: ComponentType<{ size?: number; className?: string }>; name: string; body: string; tags: string[]; file: string }
type OpsCard = { icon: ComponentType<{ size?: number; className?: string }>; title: string; body: string }

const TEXT: Record<
  Lang,
  {
    badge: string
    heroLead: string
    heroHighlight: string
    heroSub: string
    quickstart: string
    docs: string
    featuresLabel: string
    featuresTitle: string
    featuresSub: string
    features: Feature[]
    howLabel: string
    howTitle: string
    howSub: string
    steps: Step[]
    archLabel: string
    archTitle: string
    archSub: string
    modulesLabel: string
    modulesTitle: string
    modulesSub: string
    modules: ModuleCard[]
    opsLabel: string
    opsTitle: string
    opsSub: string
    ops: OpsCard[]
  }
> = {
  fr: {
    badge: 'Plateforme self-hosted',
    heroLead: 'Ton homelab,',
    heroHighlight: 'entièrement modulaire',
    heroSub:
      "Une plateforme unifiée pour gérer tes services self-hosted. Ajoute des modules sans toucher au code backend --- juste du JSON et du XML.",
    quickstart: 'Démarrage rapide',
    docs: 'Créer un module',
    featuresLabel: 'Fonctionnalités',
    featuresTitle: "Tout ce dont tu as besoin, rien de superflu",
    featuresSub: "Le cœur gère l'infrastructure. Toi tu déclares ce que tu veux faire.",
    features: [
      { icon: Package, title: 'Système de modules', body: "Chaque module est un dossier avec un manifest.json. Le backend le découvre, crée sa base de données et l'expose automatiquement." },
      { icon: Database, title: 'Base de données auto-générée', body: 'Déclare tes colonnes dans un fichier XML --- le backend génère la table SQL, les contraintes et les relations sans aucun ORM à configurer.' },
      { icon: LayoutTemplate, title: 'UI déclarative', body: 'Ton interface est un fichier JSON. Composants prêts à l’emploi : listes, formulaires, upload, galerie, modale --- aucun JSX à écrire.' },
      { icon: Activity, title: 'Télémétrie système', body: 'CPU, RAM, stockage et uptime en temps réel via OSHI, exposés par le cœur au dashboard.' },
      { icon: ShieldCheck, title: 'Auth JWT intégrée', body: "Inscription soumise à validation admin, login par token JWT. Panel d'administration dédié." },
      { icon: Sliders, title: 'Paramètres par module', body: 'Chaque module peut exposer des paramètres configurables depuis l’UI (clés API, URLs, secrets masqués) sans redémarrage.' },
    ],
    howLabel: 'Fonctionnement',
    howTitle: 'Zéro code pour un nouveau module',
    howSub: "Du dossier vide à un module fonctionnel en quelques fichiers texte.",
    steps: [
      { title: 'Créer le dossier', body: <>Un dossier dans <code>HOMELAB_MODULES_SCAN_PATH</code>. Le nom devient l'ID du module.</> },
      { title: 'Déclarer le manifest', body: <>Un <code>manifest.json</code> qui liste les fonctions, leurs types d'actions et les fichiers XML associés.</> },
      { title: 'Définir le schéma XML', body: 'Le backend génère automatiquement les tables SQL à partir des colonnes déclarées. Contraintes, types, relations inclus.' },
      { title: "Écrire l'UI en JSON", body: 'Liste les composants visuels, lie les bindings aux fonctions, définit le state et les actions chaînées.' },
      { title: 'Redémarrer le backend', body: 'Le module apparaît dans le dashboard. Démarrage, arrêt, paramètres --- tout depuis l’UI.' },
    ],
    archLabel: 'Architecture',
    archTitle: "Flux d'un appel de module",
    archSub: "De l'interface JSON jusqu'à la base de données, sans écrire de contrôleur.",
    modulesLabel: 'Module',
    modulesTitle: 'Prêt à l’emploi',
    modulesSub: 'Quatre modules de démonstration illustrant les capacités de la plateforme. Téléchargeables directement, prêts à déposer dans ton dossier de modules.',
    modules: [
      { icon: Image, name: 'Photos', body: 'Upload, stockage et visualisation de photos.', tags: ['UPLOAD_FILE', 'GET_FILE', 'LIST', 'DELETE'], file: 'photos.zip' },
      { icon: Film, name: 'Médiathèque', body: 'Upload, stockage et lecture de fichiers audio et vidéo.', tags: ['UPLOAD_FILE', 'GET_FILE', 'LIST', 'DELETE'], file: 'mediatheque.zip' },
      { icon: BookOpenText, name: 'Reader', body: 'Liseuse photo organisée en séries et chapitres, dépendante du module Photos.', tags: ['dépendance', 'CREATE', 'READ', 'LIST'], file: 'reader.zip' },
      { icon: CloudSun, name: 'Météo', body: 'Appel OpenWeatherMap, cache des résultats en base. Clé API configurable.', tags: ['FETCH_EXTERNAL', 'params.json', 'LIST'], file: 'weather.zip' },
    ],
    opsLabel: 'Administration',
    opsTitle: "Panel d'administration",
    opsSub: 'Un espace dédié aux opérations sensibles, accessible uniquement aux admins.',
    ops: [
      { icon: ScrollText, title: 'Logs en direct', body: 'Consultation des logs applicatifs en temps réel depuis le panel.' },
      { icon: Users, title: 'Gestion des accès', body: "Liste des utilisateurs, validation des inscriptions en attente, révocation de comptes." },
      { icon: Settings2, title: 'Paramètres globaux', body: "Configuration générale de l'application." },
    ],
  },
  en: {
    badge: 'Self-hosted platform',
    heroLead: 'Your homelab,',
    heroHighlight: 'fully modular',
    heroSub:
      'A unified platform to manage your self-hosted services. Add modules without touching backend code --- just JSON and XML.',
    quickstart: 'Quickstart',
    docs: 'Create a module',
    featuresLabel: 'Features',
    featuresTitle: 'Everything you need, nothing you don’t',
    featuresSub: 'The core handles the infrastructure. You declare what you want to do.',
    features: [
      { icon: Package, title: 'Module system', body: "Each module is a folder with a manifest.json. The backend discovers it, creates its database and exposes it automatically." },
      { icon: Database, title: 'Auto-generated database', body: 'Declare your columns in an XML file --- the backend generates the SQL table, constraints and relations, no ORM to configure.' },
      { icon: LayoutTemplate, title: 'Declarative UI', body: 'Your interface is a JSON file. Ready-made components: lists, forms, upload, gallery, modal --- no JSX to write.' },
      { icon: Activity, title: 'System telemetry', body: 'CPU, RAM, storage and uptime in real time via OSHI, exposed by the core to the dashboard.' },
      { icon: ShieldCheck, title: 'Built-in JWT auth', body: 'Sign-up subject to admin approval, JWT token login. Dedicated administration panel.' },
      { icon: Sliders, title: 'Per-module settings', body: 'Each module can expose configurable parameters from the UI (API keys, URLs, masked secrets) with no restart.' },
    ],
    howLabel: 'How it works',
    howTitle: 'Zero code for a new module',
    howSub: 'From an empty folder to a working module in a handful of text files.',
    steps: [
      { title: 'Create the folder', body: <>A folder inside <code>HOMELAB_MODULES_SCAN_PATH</code>. Its name becomes the module ID.</> },
      { title: 'Declare the manifest', body: <>A <code>manifest.json</code> listing the functions, their action types and the associated XML files.</> },
      { title: 'Define the XML schema', body: 'The backend automatically generates the SQL tables from the declared columns --- constraints, types, relations included.' },
      { title: 'Write the UI in JSON', body: 'List the visual components, bind them to functions, define the state and chained actions.' },
      { title: 'Restart the backend', body: 'The module appears in the dashboard. Start, stop, settings --- all from the UI.' },
    ],
    archLabel: 'Architecture',
    archTitle: 'Flow of a module call',
    archSub: 'From the JSON interface down to the database, with no controller to write.',
    modulesLabel: 'Module',
    modulesTitle: 'Ready to use',
    modulesSub: 'Four demo modules illustrating the platform’s capabilities. Downloadable straight from here, ready to drop into your modules folder.',
    modules: [
      { icon: Image, name: 'Photos', body: 'Upload, storage and viewing of photos.', tags: ['UPLOAD_FILE', 'GET_FILE', 'LIST', 'DELETE'], file: 'photos.zip' },
      { icon: Film, name: 'Media Library', body: 'Upload, storage and playback of audio and video files.', tags: ['UPLOAD_FILE', 'GET_FILE', 'LIST', 'DELETE'], file: 'mediatheque.zip' },
      { icon: BookOpenText, name: 'Reader', body: 'Photo reader organized into series and chapters, depends on the Photos module.', tags: ['dependency', 'CREATE', 'READ', 'LIST'], file: 'reader.zip' },
      { icon: CloudSun, name: 'Weather', body: 'Calls OpenWeatherMap, caches results in the database. Configurable API key.', tags: ['FETCH_EXTERNAL', 'params.json', 'LIST'], file: 'weather.zip' },
    ],
    opsLabel: 'Administration',
    opsTitle: 'Admin panel',
    opsSub: 'A dedicated space for sensitive operations, accessible to admins only.',
    ops: [
      { icon: ScrollText, title: 'Live logs', body: 'Real-time application logs from the panel.' },
      { icon: Users, title: 'Access management', body: 'User list, approval of pending sign-ups, account revocation.' },
      { icon: Settings2, title: 'Global settings', body: 'General application configuration.' },
    ],
  },
}

function SectionLabel({ children }: { children: string }) {
  return <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">{children}</p>
}

function Home() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      {/* Hero */}
      <div className="badge badge-outline gap-2 py-3 px-4 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t.badge}</span>
      </div>

      <h1 className="text-5xl sm:text-6xl font-black leading-[1.1] tracking-tight mb-6">
        {t.heroLead}
        <br />
        <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
          {t.heroHighlight}
        </span>
      </h1>

      <p className="text-xl text-base-content/70 max-w-2xl leading-relaxed">{t.heroSub}</p>

      <div className="flex flex-wrap gap-3 mt-8">
        <Link to="/quickstart" className="btn btn-primary gap-2">
          <Terminal size={18} />
          {t.quickstart}
        </Link>
        <Link to="/docs/module" className="btn btn-outline gap-2">
          <BookOpen size={18} />
          {t.docs}
        </Link>
      </div>

      <div className="divider my-16" />

      {/* Features */}
      <SectionLabel>{t.featuresLabel}</SectionLabel>
      <h2 className="text-3xl font-bold mb-2">{t.featuresTitle}</h2>
      <p className="text-base-content/60 max-w-xl mb-8">{t.featuresSub}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.map((f) => (
          <div key={f.title} className="card bg-base-100 border border-base-content/10">
            <div className="card-body gap-2">
              <f.icon size={22} className="text-primary mb-1" />
              <h3 className="card-title text-base">{f.title}</h3>
              <p className="text-sm text-base-content/60 leading-relaxed">{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="divider my-16" />

      {/* How it works */}
      <SectionLabel>{t.howLabel}</SectionLabel>
      <h2 className="text-3xl font-bold mb-2">{t.howTitle}</h2>
      <p className="text-base-content/60 max-w-xl mb-8">{t.howSub}</p>

      <ol className="flex flex-col">
        {t.steps.map((s, i) => (
          <li key={s.title} className="flex gap-4 pb-8">
            <div className="w-9 h-9 rounded-full border-2 border-primary text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {i + 1}
            </div>
            <div className="pt-1">
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-base-content/60">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="divider my-16" />

      {/* Architecture */}
      <SectionLabel>{t.archLabel}</SectionLabel>
      <h2 className="text-3xl font-bold mb-2">{t.archTitle}</h2>
      <p className="text-base-content/60 max-w-xl mb-8">{t.archSub}</p>

      <div className="card bg-base-100 border border-base-content/10">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="badge badge-ghost font-mono text-xs py-3">{step}</span>
                {i < FLOW.length - 1 && <ArrowRight size={14} className="text-base-content/30" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="divider my-16" />

      {/* Modules showcase */}
      <SectionLabel>{t.modulesLabel}</SectionLabel>
      <h2 className="text-3xl font-bold mb-2">{t.modulesTitle}</h2>
      <p className="text-base-content/60 max-w-xl mb-8">{t.modulesSub}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.modules.map((m) => (
          <div key={m.name} className="card bg-base-100 border border-base-content/10">
            <div className="card-body gap-2">
              <m.icon size={22} className="text-accent mb-1" />
              <h3 className="card-title text-base">{m.name}</h3>
              <p className="text-sm text-base-content/60 leading-relaxed">{m.body}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.tags.map((tag) => (
                  <span key={tag} className="badge badge-sm badge-ghost font-mono">
                    {tag}
                  </span>
                ))}
              </div>
              <a href={`/modules/${m.file}`} download className="btn btn-outline btn-sm gap-2 mt-2 self-start">
                <Download size={14} /> {m.file}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="divider my-16" />

      {/* Admin / ops */}
      <SectionLabel>{t.opsLabel}</SectionLabel>
      <h2 className="text-3xl font-bold mb-2">{t.opsTitle}</h2>
      <p className="text-base-content/60 max-w-xl mb-8">{t.opsSub}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {t.ops.map((o) => (
          <div key={o.title} className="card bg-base-100 border border-base-content/10">
            <div className="card-body gap-2">
              <o.icon size={20} className="text-secondary mb-1" />
              <h3 className="card-title text-sm">{o.title}</h3>
              <p className="text-sm text-base-content/60 leading-relaxed">{o.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
