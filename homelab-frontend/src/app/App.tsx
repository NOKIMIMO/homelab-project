import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router';
import { BarChart, Camera, Box, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import type { AppOutletContext, Module } from '@app/types';
import './index.css';
import { authFetch } from '@auth/f_authFetch';

export type { AppOutletContext, Module };

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin ,logout } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [isModulesRefreshing, setIsModulesRefreshing] = useState(false);

  const activeModuleId = useMemo(() => {
    if (!location.pathname.startsWith('/plugins/')) return null;
    return location.pathname.replace('/plugins/', '');
  }, [location.pathname]);

  const fetchModules = useCallback(async () => {
  setIsModulesRefreshing(true);

  try {
    const response = await authFetch("/api/modules", {}, () => {
      logout();
      navigate("/login");
    });

    if (!response) return;

    const data = await response.json();
    setModules(data);

  } catch (error) {
    console.error("Error fetching modules:", error);
  } finally {
    setIsModulesRefreshing(false);
  }
}, [logout, navigate]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (activeModuleId) {
      sessionStorage.setItem('homelab_last_module', activeModuleId);
    } else {
      sessionStorage.removeItem('homelab_last_module');
    }
  }, [activeModuleId]);

  return (
    <div className="drawer lg:drawer-open h-dvh overflow-hidden" data-theme="night">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-0 flex-col bg-base-200">
        <div className="navbar bg-base-300 lg:hidden shadow-sm">
          <div className="flex-none">
            <label htmlFor="my-drawer-2" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <Menu size={24} />
            </label>
          </div>
          <div className="flex-1">
            <span className="btn btn-ghost normal-case text-xl font-bold">Homelab Core</span>
          </div>
        </div>

        <main className="flex-1 w-full min-h-0 overflow-hidden">
          <Outlet context={{ modules, onRefresh: fetchModules, isModulesRefreshing }} />
        </main>
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu p-4 w-72 min-h-full bg-base-300 text-base-content border-r border-base-100 flex flex-col">
          <div className="mb-6 px-4 hidden lg:block">
            <h2 className="text-2xl font-black bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Homelab</h2>
          </div>

          <ul className="flex-1 space-y-2 mt-4 lg:mt-0">
            <li>
              <button
                className={location.pathname === '/' ? 'active font-medium' : 'font-medium'}
                onClick={() => navigate('/')}
              >
                <BarChart size={20} className="mr-1 opacity-70" />
                <span className="text-[15px]">Vue d'ensemble</span>
              </button>
            </li>
            {isAdmin && (
              <li>
                <button
                  className={location.pathname === '/admin' ? 'active font-medium' : 'font-medium'}
                  onClick={() => navigate('/admin')}
                >
                  <ShieldCheck size={20} className="mr-1 opacity-70" />
                  <span className="text-[15px]">Administration</span>
                </button>
              </li>
            )}
            <div className="divider text-xs text-base-content/50 uppercase tracking-widest my-6">Applications</div>
            {modules.map(mod => (
              <li key={mod.id}>
                <button
                  className={activeModuleId === mod.id ? 'active flex justify-between' : 'flex justify-between'}
                  onClick={() => navigate(`/plugins/${mod.id}`)}
                >
                  <span className="flex items-center gap-3 font-medium">
                    {mod.icon ? (
                      <img
                        src={mod.icon}
                        alt=""
                        className="h-4.5 w-4.5 rounded-sm object-cover opacity-80"
                        loading="lazy"
                      />
                    ) : mod.icon === 'Image' ? (
                      <Camera size={18} className="opacity-70" />
                    ) : (
                      <Box size={18} className="opacity-70" />
                    )}
                    <span className="text-[15px]">{mod.name}</span>
                  </span>
                  <div className={`badge badge-xs ${mod.status === 'ACTIVE' ? 'badge-success shadow-[0_0_8px_rgba(54,211,153,0.5)]' : 'badge-error'}`}></div>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto px-2 space-y-2">
            {/* <button
              className={`btn bg-base-100 btn-sm w-full gap-2 ${location.pathname === '/settings' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => navigate('/settings')}
            >
              <Settings size={16} /> Options
            </button> */}
            <button
              className="btn btn-ghost btn-sm w-full gap-2 text-error"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Quitter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
