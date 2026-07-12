import type {
  Cardinality,
  ColumnSpec,
  ColumnType,
  CustomFunctionParamSpec,
  CustomFunctionSpec,
  DependencySpec,
  ExternalFetchSpec,
  LogicStepSpec,
  ModuleActionParameterType,
  ModuleParamSpec,
  RelationSpec,
  TableSpec,
} from '@app/types';

export const COLUMN_TYPES: ColumnType[] = ['string', 'int', 'long', 'boolean', 'date', 'datetime'];
export const CARDINALITIES: { value: Cardinality; label: string }[] = [
  { value: 'ONE_TO_MANY', label: 'Un vers plusieurs' },
  { value: 'MANY_TO_ONE', label: 'Plusieurs vers un' },
  { value: 'ONE_TO_ONE', label: 'Un vers un' },
  { value: 'MANY_TO_MANY', label: 'Plusieurs vers plusieurs' },
];
export const PARAM_TYPES: ModuleParamSpec['type'][] = ['string', 'secret', 'boolean', 'number'];
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
export const ACTION_PARAM_TYPES: ModuleActionParameterType[] = ['NONE', 'EQUAL', 'GREATER', 'LESS', 'GREATER_EQUAL', 'LESS_EQUAL'];

export const emptyColumn = (): ColumnSpec => ({ name: '', type: 'string', nullable: true, unique: false });
export const emptyRelation = (defaultTarget: string): RelationSpec => ({
  targetTable: defaultTarget,
  cardinality: 'ONE_TO_MANY',
  cascadeDelete: false,
});

export const emptyFetch = (): ExternalFetchSpec => ({
  functionName: '',
  description: '',
  urlTemplate: '',
  method: 'GET',
  queryParams: [],
  responseMapping: {},
  upsertKey: '',
});
export const emptyParam = (): ModuleParamSpec => ({ key: '', label: '', type: 'string', defaultValue: '', description: '' });
export const emptyDependency = (defaultTarget: string): DependencySpec => ({ moduleId: defaultTarget, version: '' });
export const emptyLogicStep = (defaultActionType: string): LogicStepSpec => ({ actionType: defaultActionType, params: {} });
export const emptyCustomFunctionParam = (): CustomFunctionParamSpec => ({ name: '', type: 'NONE', description: '', optional: true });
export const emptyCustomFunction = (defaultActionType: string): CustomFunctionSpec => ({
  name: '',
  description: '',
  parameters: [],
  logic: [emptyLogicStep(defaultActionType)],
});
export const emptyTable = (): TableSpec => ({
  name: '',
  columns: [emptyColumn()],
  enableFileStorage: false,
  relations: [],
  uniqueTogether: [],
  externalFetches: [],
  customFunctions: [],
});

// Stamps each table/column with its current name as previousName, frozen at load time, so the
// backend can tell a rename (name changed, previousName still matches an existing one) apart
// from a brand-new table/column (no matching previousName). Only meaningful when editing.
export const stampPreviousNames = (tables: TableSpec[]): TableSpec[] =>
  tables.map(t => ({
    ...t,
    previousName: t.name,
    columns: t.columns.map(c => ({ ...c, previousName: c.name })),
  }));
