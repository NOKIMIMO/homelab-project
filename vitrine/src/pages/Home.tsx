import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Terminal, BookOpen } from 'lucide-react'
import { useLanguage, type Lang } from '../i18n/LanguageContext'

const TEXT: Record<
  Lang,
  {
    tagline: (manifest: string) => ReactNode
    quickstart: string
    docs: string
    cards: { title: string; body: string }[]
  }
> = {
  fr: {
    tagline: (manifest) => (
      <>
        Orchestrateur de services auto-hébergés. Un cœur (authentification,
        stockage, supervision) et des modules indépendants pilotés par un
        simple <code className="text-accent">{manifest}</code>.
      </>
    ),
    quickstart: 'Démarrage rapide',
    docs: 'Documentation',
    cards: [
      { title: 'Core', body: "Kotlin / Spring Boot — authentification, scan des modules, stockage de fichiers, supervision." },
      { title: 'Modules', body: 'Dossiers indépendants (manifest + schéma + UI) scannés au démarrage, sans recompilation du core.' },
      { title: 'Frontend', body: 'React / TypeScript / Vite — dashboard, gestion des modules, administration.' },
      { title: 'SDK', body: "Types Kotlin partagés pour écrire la logique métier d'un module (schéma, relations, filtres, actions)." },
    ],
  },
  en: {
    tagline: (manifest) => (
      <>
        Self-hosted service orchestrator. A core (authentication, storage,
        monitoring) and independent modules driven by a plain{' '}
        <code className="text-accent">{manifest}</code>.
      </>
    ),
    quickstart: 'Quickstart',
    docs: 'Documentation',
    cards: [
      { title: 'Core', body: 'Kotlin / Spring Boot — authentication, module scanning, file storage, monitoring.' },
      { title: 'Modules', body: 'Independent folders (manifest + schema + UI) scanned at startup, no core recompilation needed.' },
      { title: 'Frontend', body: 'React / TypeScript / Vite — dashboard, module management, administration.' },
      { title: 'SDK', body: "Shared Kotlin types for writing a module's backend logic (schema, relations, filters, actions)." },
    ],
  },
}

function Home() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      <h1 className="text-5xl font-black mb-5">Homelab</h1>
      <p className="text-xl text-base-content/70 max-w-2xl leading-relaxed">
        {t.tagline('manifest.json')}
      </p>

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

      <div className="divider my-10" />

      <div className="grid gap-4 sm:grid-cols-2">
        {t.cards.map((card) => (
          <div key={card.title} className="card bg-base-100 border border-base-content/10">
            <div className="card-body">
              <h3 className="card-title text-lg">{card.title}</h3>
              <p className="text-base text-base-content/60">{card.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
