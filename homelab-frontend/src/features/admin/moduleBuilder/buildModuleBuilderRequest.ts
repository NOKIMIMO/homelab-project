import type { DependencySpec, ModuleBuilderRequest, ModuleParamSpec, TableSpec } from '@app/types';

interface BuildInput {
  id: string;
  name: string;
  description: string;
  tables: TableSpec[];
  params: ModuleParamSpec[];
  dependencies: DependencySpec[];
  icon: string | null;
  uiMode: string;
  uiCustomized: boolean;
}

export function buildModuleBuilderRequest(input: BuildInput): ModuleBuilderRequest {
  return {
    id: input.id.trim(),
    name: input.name.trim(),
    description: input.description.trim() || undefined,
    tables: input.tables.map(t => ({
      ...t,
      name: t.name.trim(),
      columns: t.columns.filter(c => c.name.trim()).map(c => ({ ...c, name: c.name.trim() })),
      uniqueTogether: t.uniqueTogether.filter(g => g.length >= 2),
      externalFetches: t.externalFetches
        .filter(f => f.functionName.trim() && f.urlTemplate.trim() && Object.keys(f.responseMapping).some(k => k.trim()))
        .map(f => ({
          ...f,
          functionName: f.functionName.trim(),
          responseMapping: Object.fromEntries(
            Object.entries(f.responseMapping).filter(([k]) => k.trim())
          ),
          upsertKey: f.upsertKey?.trim() || undefined,
        })),
      customFunctions: t.customFunctions
        .filter(f => f.name.trim() && f.logic.length > 0)
        .map(f => ({
          ...f,
          name: f.name.trim(),
          parameters: f.parameters.filter(p => p.name.trim()).map(p => ({ ...p, name: p.name.trim() })),
          logic: f.logic.map(s => ({
            ...s,
            params: Object.fromEntries(Object.entries(s.params).filter(([k]) => k.trim())),
          })),
        })),
    })),
    params: input.params.filter(p => p.key.trim() && p.label.trim()).map(p => ({ ...p, key: p.key.trim() })),
    dependencies: input.dependencies.filter(d => d.moduleId.trim()).map(d => ({ ...d, version: d.version.trim() })),
    icon: input.icon,
    uiMode: input.uiMode,
    uiCustomized: input.uiCustomized,
  };
}
