import { useOutletContext } from 'react-router';
import Dashboard from '../components/Dashboard';
import type { AppOutletContext } from '../App';

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
