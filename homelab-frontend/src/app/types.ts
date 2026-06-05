export interface Module {
  id: string;
  name: string;
  status: string;
  icon: string;
  description?: string;
  uptimeStart?: number;
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
