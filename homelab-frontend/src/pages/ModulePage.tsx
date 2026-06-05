import { useOutletContext, useParams } from 'react-router';
import type { AppOutletContext } from '@app/types';
import ModuleView from '@features/module/ModuleView';

export default function ModulePage() {
  const { moduleId } = useParams();
  const { modules } = useOutletContext<AppOutletContext>();
  const module = modules.find((item) => item.id === moduleId);

  return (
    <ModuleView module={module} />
  );
}
