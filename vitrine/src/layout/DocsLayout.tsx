import { NavLink, Outlet } from 'react-router'
import { Menu, Home, Terminal, Boxes, GitBranch, LayoutTemplate, Package, Puzzle, Languages } from 'lucide-react'
import { useLanguage, type Lang } from '../i18n/LanguageContext'

const TEXT: Record<Lang, {
  subtitle: string
  overview: string
  quickstart: string
  module: string
  orm: string
  ui: string
  sdk: string
  plugin: string
  docsGroup: string
}> = {
  fr: {
    subtitle: 'Documentation & démarrage rapide',
    overview: "Vue d'ensemble",
    quickstart: 'Démarrage rapide',
    module: 'Créer un module',
    orm: 'Cardinalité ORM',
    ui: 'Interface en JSON',
    sdk: 'SDK',
    plugin: 'Écrire un plugin',
    docsGroup: 'Documentation',
  },
  en: {
    subtitle: 'Documentation & quickstart',
    overview: 'Overview',
    quickstart: 'Quickstart',
    module: 'Create a module',
    orm: 'ORM cardinality',
    ui: 'JSON-driven UI',
    sdk: 'SDK',
    plugin: 'Write a plugin',
    docsGroup: 'Documentation',
  },
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center justify-between gap-2 ${isActive ? 'active font-medium' : 'font-medium'}`
}

function LanguageSelect() {
  const { lang, setLang } = useLanguage()
  return (
    <label className="flex items-center gap-2 px-4 mb-4">
      <Languages size={16} className="opacity-60" />
      <select
        className="select select-sm select-bordered w-full"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label="Language"
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </label>
  )
}

function SidebarContent() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  const topNav = [{ to: '/', label: t.overview, icon: Home, end: true }]
  const docsNav = [
    { to: '/quickstart', label: t.quickstart, icon: Terminal },
    { to: '/docs/module', label: t.module, icon: Boxes },
    { to: '/docs/orm', label: t.orm, icon: GitBranch },
    { to: '/docs/ui', label: t.ui, icon: LayoutTemplate},
    { to: '/docs/sdk', label: t.sdk, icon: Package },
    { to: '/docs/plugin', label: t.plugin, icon: Puzzle },
  ]

  return (
    <>
      <div className="mb-4 px-4 hidden lg:block">
        <h2 className="text-2xl font-black bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
          Homelab
        </h2>
        <p className="text-xs text-base-content/50 mt-1">{t.subtitle}</p>
      </div>

      <LanguageSelect />

      <ul className="menu w-full p-0">
        {topNav.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={navLinkClass}>
              <span className="flex items-center gap-3">
                <Icon size={18} className="opacity-70" />
                <span className="text-[15px]">{label}</span>
              </span>
            </NavLink>
          </li>
        ))}

        <div className="divider text-xs text-base-content/50 uppercase tracking-widest my-4">
          {t.docsGroup}
        </div>

        {docsNav.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} className={navLinkClass}>
              <span className="flex items-center gap-3">
                <Icon size={18} className="opacity-70" />
                <span className="text-[15px]">{label}</span>
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </>
  )
}

function DocsLayout() {
  return (
    <div className="drawer lg:drawer-open min-h-dvh" data-theme="night">
      <input id="docs-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col bg-base-200">
        <div className="navbar bg-base-300 lg:hidden shadow-sm">
          <div className="flex-none">
            <label htmlFor="docs-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <Menu size={24} />
            </label>
          </div>
          <div className="flex-1">
            <span className="btn btn-ghost normal-case text-xl font-bold">Homelab</span>
          </div>
        </div>

        <main className="flex-1 w-full">
          <div className="max-w-5xl mx-auto px-6 py-10 lg:px-16 lg:py-16 text-[17px] leading-relaxed">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="docs-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu p-4 w-72 min-h-full bg-base-300 text-base-content border-r border-base-100">
          <SidebarContent />
        </div>
      </div>
    </div>
  )
}

export default DocsLayout
