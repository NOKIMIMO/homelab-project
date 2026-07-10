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

export type ColumnType = 'string' | 'int' | 'long' | 'boolean' | 'date' | 'datetime';

export type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

export interface ColumnSpec {
  name: string;
  type: ColumnType;
  nullable: boolean;
  unique: boolean;
  regex?: string | null;
  // Only sent on an update request: the column's name before this edit, so renaming can be
  // applied in place instead of being read as "remove old column, add a new one".
  previousName?: string;
}

export interface RelationSpec {
  targetTable: string;
  cardinality: Cardinality;
  cascadeDelete: boolean;
}

export interface ExternalFetchSpec {
  functionName: string;
  description?: string;
  urlTemplate: string;
  queryParams: string[];
  responseMapping: Record<string, string>;
  upsertKey?: string | null;
}

export interface ModuleParamSpec {
  key: string;
  label: string;
  type: 'string' | 'secret' | 'boolean' | 'number';
  defaultValue: string;
  description: string;
}

export interface TableSpec {
  name: string;
  columns: ColumnSpec[];
  enableFileStorage: boolean;
  relations: RelationSpec[];
  uniqueTogether: string[][];
  externalFetches: ExternalFetchSpec[];
  // Only sent on an update request: the table's name before this edit.
  previousName?: string;
}

export interface ModuleBuilderRequest {
  id: string;
  name: string;
  description?: string;
  tables: TableSpec[];
  params: ModuleParamSpec[];
}

export interface ModuleBuilderSummary {
  id: string;
  name: string;
  description?: string | null;
  custom: boolean;
}

export interface ModuleSchemaResponse {
  moduleId: string;
  name: string;
  description?: string | null;
  tables: TableSpec[];
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
