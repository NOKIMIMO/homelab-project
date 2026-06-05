import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from '@auth/AuthProvider';
import RequireAuth from '@auth/RequireAuth';
import DashboardPage from '@pages/DashboardPage';
import KeyManagerPage from '@pages/KeyManagerPage';
import LoginPage from '@pages/LoginPage';
import ModulePage from '@pages/ModulePage';
import '@app/index.css';
import App from '@app/App';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'plugins/:moduleId', element: <ModulePage /> },
      { path: 'settings', element: <KeyManagerPage /> },
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
