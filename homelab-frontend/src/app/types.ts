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

export type ModuleActionParameterType = 'EQUAL' | 'GREATER' | 'LESS' | 'GREATER_EQUAL' | 'LESS_EQUAL' | 'NONE';

export interface LogicStepSpec {
  actionType: string;
  params: Record<string, string>;
}

export interface CustomFunctionParamSpec {
  name: string;
  type: ModuleActionParameterType;
  description: string;
  optional: boolean;
}

export interface CustomFunctionSpec {
  name: string;
  description: string;
  parameters: CustomFunctionParamSpec[];
  logic: LogicStepSpec[];
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
  customFunctions: CustomFunctionSpec[];
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

export interface ModuleStorageData {
    id: string;
    name: string;
    storageGb: number;
}

export interface ResourceLimitsStatus {
    maxRamGb: number;
    maxDiskGb: number;
    activeMaxRamGb: number;
    usedDiskGb: number;
    ramRestartRequired: boolean;
    machineMaxRamGb: number;
    machineMaxDiskGb: number;
}

export interface TelemetryData {
    cpu: {
        total: number;
        coreUsed: number;
    };
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
    perModuleStorage: ModuleStorageData[];
}

// ─── Alerts ───

export type MetricType = 'CPU' | 'RAM' | 'DISK';
export type AlertOperator = 'GT' | 'GTE' | 'LT' | 'LTE';
export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertRule {
  id: number;
  name: string;
  metric: MetricType;
  operator: AlertOperator;
  operatorSymbol: string;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRuleRequest {
  name: string;
  metric: MetricType;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
}

// What produced an event. 'RULE' events are metric threshold breaches (metric/threshold/value
// populated); 'ACCOUNT' (a sign-up awaiting validation) and 'ERROR' (a server error) reuse the
// same list but carry no metric.
export type AlertSource = 'RULE' | 'ACCOUNT' | 'ERROR';

export interface AlertEvent {
  id: number;
  source: AlertSource;
  ruleId: number | null;
  ruleName: string;
  metric: MetricType | null;
  severity: AlertSeverity;
  threshold: number;
  value: number;
  message: string;
  triggeredAt: string;
}

export interface AlertOptions {
  metrics: { name: MetricType; label: string; unit: string }[];
  operators: { name: AlertOperator; symbol: string }[];
  severities: AlertSeverity[];
}

// ─── Roles ───

export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// A weekly slot during which the role's access is blocked. "HH:mm[:ss]"; end < start crosses midnight.
export interface BlockedWindow {
  dayOfWeek: DayOfWeek;
  start: string;
  end: string;
}

// The single "administration" capability a role can grant, separate from its module access.
// A holder acts as an administrator-equivalent (everything except ejecting the administrator or
// changing the administrator's account); it is also what the mobile app requires to sign in.
export type AdminPermission = 'ADMIN_ACCESS';

export interface Role {
  id: number;
  name: string;
  moduleIds: string[];
  blockedWindows: BlockedWindow[];
  adminPermissions: AdminPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleRequest {
  name: string;
  moduleIds: string[];
  blockedWindows: BlockedWindow[];
  adminPermissions: AdminPermission[];
}
