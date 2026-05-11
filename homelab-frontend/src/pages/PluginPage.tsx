import { useOutletContext, useParams } from 'react-router';
import ModuleView from '../components/ModuleView';
import type { AppOutletContext } from '../App';

export default function PluginPage() {
  const { moduleId } = useParams();
  const { modules } = useOutletContext<AppOutletContext>();
  const module = modules.find((item) => item.id === moduleId);

  return <ModuleView module={module} />;
}
