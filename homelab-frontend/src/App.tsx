import { useState, useEffect } from 'react';
import { BarChart, Camera, Box, Menu, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ModuleView from './components/ModuleView';
import Login from './components/Login';
import KeyManager from './components/KeyManager';
import { getApiUrl } from './api';
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
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('homelab_token');
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('homelab_user_name') || '';
  });

  const handleLoginSuccess = (token: string, keyName: string) => {
    localStorage.setItem('homelab_token', token);
    localStorage.setItem('homelab_user_name', keyName);
    setIsAuthenticated(true);
    setUserName(keyName);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelab_token');
    localStorage.removeItem('homelab_user_name');
    setIsAuthenticated(false);
  };

  const fetchModules = async () => {
    setIsModulesRefreshing(true);
    const token = localStorage.getItem('homelab_token');
    try {
      const response = await fetch(getApiUrl('/api/modules'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // console.log("modules : ", response)
      const data = await response.json();
      // console.log(data)
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
  if (!isAuthenticated) {
    return (
      <div className="relative">
        {showKeyManager ? (
          <div className="min-h-screen bg-base-300 flex flex-col pt-12">
            <div className="max-w-4xl mx-auto w-full px-4 text-center mb-6">
              <button className="btn btn-ghost btn-sm gap-2" onClick={() => setShowKeyManager(false)}>
                ← Retour à la connexion
              </button>
            </div>
            <KeyManager />
          </div>
        ) : (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onShowBootstrap={() => setShowKeyManager(true)}
          />
        )}
      </div>
    );
  }

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
          {showKeyManager ? (
            <KeyManager />
          ) : activeModule === null ? (
            <Dashboard
              modules={modules}
              onRefresh={fetchModules}
              isModulesRefreshing={isModulesRefreshing}
            />
          ) : (
            <ModuleView module={modules.find(m => m.id === activeModule)} />
          )}
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
              <button
                className={activeModule === null && !showKeyManager ? 'active font-medium' : 'font-medium'}
                onClick={() => { setActiveModule(null); setShowKeyManager(false); }}
              >
                <BarChart size={20} className="mr-1 opacity-70" />
                <span className="text-[15px]">Vue d'ensemble</span>
              </button>
            </li>
            <div className="divider text-xs text-base-content/50 uppercase tracking-widest my-6">Applications</div>
            {modules.map(mod => (
              <li key={mod.id}>
                <button
                  className={activeModule === mod.id && !showKeyManager ? 'active flex justify-between' : 'flex justify-between'}
                  onClick={() => { setActiveModule(mod.id); setShowKeyManager(false); }}
                >
                  <span className="flex items-center gap-3 font-medium">
                    {mod.icon === 'Image' ? <Camera size={18} className="opacity-70" /> : <Box size={18} className="opacity-70" />}
                    <span className="text-[15px]">{mod.name}</span>
                  </span>
                  <div className={`badge badge-xs ${mod.status === 'ACTIVE' ? 'badge-success shadow-[0_0_8px_rgba(54,211,153,0.5)]' : 'badge-error'}`}></div>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto px-2 space-y-2">
            <button
              className={`btn btn-sm w-full gap-2 ${showKeyManager ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowKeyManager(true)}
            >
              <Settings size={16} /> Options
            </button>
            <button className="btn btn-ghost btn-sm w-full gap-2 text-error" onClick={handleLogout}>
              Quitter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
