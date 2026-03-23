import { getApiUrl } from '../api';

export default function ModuleView({ moduleId }: { moduleId: string }) {
  return (
    <div className="w-full h-full bg-base-100 flex flex-col">
      <iframe
        src={getApiUrl(`/proxy/${moduleId}/`)}
        title={`Module ${moduleId}`}
        className="flex-1 w-full border-none shadow-inner"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
