import React from 'react';
import { ComponentsDemoPage } from './components/ComponentsDemoPage';
import './components/components.css';

/**
 * EXEMPLE: Comment utiliser la page de démo dans votre routeur
 * 
 * Intégrez cet exemple dans votre configuration de routes:
 * 
 * import { ComponentsDemoPage } from './components/ComponentsDemoPage';
 * 
 * const routes = [
 *   {
 *     path: '/',
 *     element: <AppLayout />,
 *     children: [
 *       { path: 'dashboard', element: <DashboardPage /> },
 *       { path: 'login', element: <LoginPage /> },
 *       { path: 'demo', element: <ComponentsDemoPage /> },  // 👈 Ajoutez ici
 *       // ... autres routes
 *     ]
 *   }
 * ];
 */
export const ComponentsDemoExample: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <ComponentsDemoPage />
    </div>
  );
};

export default ComponentsDemoExample;
