import { useState, useEffect } from 'react';
import { BarChart, Camera, Box, Menu, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ModuleView from './components/ModuleView';
import './index.css';

export interface Module {
  id: string;
  name: string;
  status: string;
  icon: string;
  description?: string;
  uptimeStart?: number;
}

function App() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState<string | null>(() => {
    return localStorage.getItem('homelab_last_module') || null;
  });
  const [isModulesRefreshing, setIsModulesRefreshing] = useState(false);

  const fetchModules = async () => {
    setIsModulesRefreshing(true);
    try {
      const response = await fetch('/api/modules');
      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setIsModulesRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (activeModule) {
      localStorage.setItem('homelab_last_module', activeModule);
    } else {
      localStorage.removeItem('homelab_last_module');
    }
  }, [activeModule]);

  return (
    <div className="drawer lg:drawer-open" data-theme="night">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col bg-base-200">
        <div className="navbar bg-base-300 lg:hidden shadow-sm">
          <div className="flex-none">
            <label htmlFor="my-drawer-2" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <Menu size={24} />
            </label>
          </div>
          <div className="flex-1">
            <a className="btn btn-ghost normal-case text-xl font-bold">Homelab Core</a>
          </div>
        </div>

        <main className="flex-1 w-full h-[100dvh] overflow-hidden">
          {activeModule === null ? <Dashboard
            modules={modules}
            onRefresh={fetchModules}
            isModulesRefreshing={isModulesRefreshing}
          />
            : <ModuleView moduleId={activeModule} />}
        </main>
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu p-4 w-72 min-h-full bg-base-300 text-base-content border-r border-base-100 flex flex-col">
          <div className="mb-6 px-4 hidden lg:block">
            <h2 className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Homelab</h2>
          </div>

          <ul className="flex-1 space-y-2 mt-4 lg:mt-0">
            <li>
              <button className={activeModule === null ? 'active font-medium' : 'font-medium'} onClick={() => setActiveModule(null)}>
                <BarChart size={20} className="mr-1 opacity-70" />
                <span className="text-[15px]">Vue d'ensemble</span>
              </button>
            </li>
            <div className="divider text-xs text-base-content/50 uppercase tracking-widest my-6">Applications</div>
            {modules.map(mod => (
              <li key={mod.id}>
                <button className={activeModule === mod.id ? 'active flex justify-between' : 'flex justify-between'} onClick={() => setActiveModule(mod.id)}>
                  <span className="flex items-center gap-3 font-medium">
                    {mod.icon === 'Image' ? <Camera size={18} className="opacity-70" /> : <Box size={18} className="opacity-70" />}
                    <span className="text-[15px]">{mod.name}</span>
                  </span>
                  <div className={`badge badge-xs ${mod.status === 'ACTIVE' ? 'badge-success shadow-[0_0_8px_rgba(54,211,153,0.5)]' : 'badge-error'}`}></div>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto px-2">
            <button className="btn btn-outline btn-sm w-full gap-2"><Settings size={16} /> Options</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
