import { useOutletContext } from 'react-router';
import type { AppOutletContext } from '@app/types';
import Dashboard from '@features/dashboard/Dashboard';

export default function DashboardPage() {
  const { modules, onRefresh, isModulesRefreshing } = useOutletContext<AppOutletContext>();

  return (
    <Dashboard
      modules={modules}
      onRefresh={onRefresh}
      isModulesRefreshing={isModulesRefreshing}
    />
  );
}
