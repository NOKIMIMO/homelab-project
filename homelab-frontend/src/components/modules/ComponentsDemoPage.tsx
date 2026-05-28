import React, { useEffect } from 'react';
import { ComponentsDemo } from './ComponentsDemo';
import './components.css';
import { useAuth } from '../../auth/AuthContext';

/**
 * Page de test des composants
 * Permet de visualiser et tester tous les composants en local sans backend
 * 
 * La page génère automatiquement un token de test pour bypass la page de login
 */
export const ComponentsDemoPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    // Auto-login avec un token de test
    if (!isAuthenticated) {
      const testToken = 'demo-test-token-' + Date.now();
      login(testToken, 'Demo User');
    }
  }, [isAuthenticated, login]);

  return (
    <div className="demo-container">
      <ComponentsDemo />
    </div>
  );
};
