export interface Module {
  id: string;
  name: string;
  status: string;
  icon: string;
  description?: string;
  uptimeStart?: number;
  hasParams?: boolean;
}

export interface ParamDeclaration {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'secret';
  defaultValue: string;
  description: string;
}

export interface ModuleParamsResponse {
  moduleId: string;
  declarations: ParamDeclaration[];
  values: Record<string, string | null>;
}

export interface AppOutletContext {
  modules: Module[];
  onRefresh: () => void;
  isModulesRefreshing: boolean;
}

export interface TelemetryData {
    cpu: number;
    ram: {
        total: number;
        used: number;
        coreUsed: number;
        modulesUsed: number;
    };
    disk: {
        total: number;
        used: number;
        coreStorageUsed: number;
        modulesStorageUsed: number;
    };
    activeModulesCount: number;
    uptime: number;
}
