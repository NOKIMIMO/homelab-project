import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import './index.css'
import App from './App.tsx'
import Home from './pages/Home'
import Quickstart from './pages/Quickstart'
import ModuleGuide from './pages/docs/ModuleGuide'
import OrmGuide from './pages/docs/OrmGuide'
import UiGuide from './pages/docs/UiGuide'
import SdkGuide from './pages/docs/SdkGuide'
import PluginGuide from './pages/docs/PluginGuide'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'quickstart', element: <Quickstart /> },
      { path: 'docs/module', element: <ModuleGuide /> },
      { path: 'docs/orm', element: <OrmGuide /> },
      { path: 'docs/ui', element: <UiGuide /> },
      { path: 'docs/sdk', element: <SdkGuide /> },
      { path: 'docs/plugin', element: <PluginGuide /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  </StrictMode>,
)
