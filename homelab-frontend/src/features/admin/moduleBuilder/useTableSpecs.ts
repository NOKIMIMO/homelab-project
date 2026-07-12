import { useState } from 'react';
import type {
  ColumnSpec,
  CustomFunctionParamSpec,
  CustomFunctionSpec,
  ExternalFetchSpec,
  LogicStepSpec,
  RelationSpec,
  TableSpec,
} from '@app/types';
import { emptyColumn, emptyCustomFunction, emptyCustomFunctionParam, emptyFetch, emptyLogicStep, emptyRelation, emptyTable } from './formDefaults';

export function useTableSpecs(initialTables: TableSpec[]) {
  const [tables, setTables] = useState<TableSpec[]>(initialTables);

  const otherTableNames = (idx: number) =>
    tables.filter((_, i) => i !== idx).map(t => t.name).filter(Boolean);

  const updateTable = (idx: number, patch: Partial<TableSpec>) => {
    setTables(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };
  const addTable = () => setTables(prev => [...prev, emptyTable()]);
  const removeTable = (idx: number) => setTables(prev => prev.filter((_, i) => i !== idx));

  const updateColumn = (tIdx: number, cIdx: number, patch: Partial<ColumnSpec>) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      return { ...t, columns: t.columns.map((c, j) => (j === cIdx ? { ...c, ...patch } : c)) };
    }));
  };
  const addColumn = (tIdx: number) => updateTable(tIdx, { columns: [...tables[tIdx].columns, emptyColumn()] });
  const removeColumn = (tIdx: number, cIdx: number) =>
    updateTable(tIdx, { columns: tables[tIdx].columns.filter((_, j) => j !== cIdx) });

  const updateRelation = (tIdx: number, rIdx: number, patch: Partial<RelationSpec>) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      return { ...t, relations: t.relations.map((r, j) => (j === rIdx ? { ...r, ...patch } : r)) };
    }));
  };
  const addRelation = (tIdx: number) => {
    const target = otherTableNames(tIdx)[0] ?? '';
    updateTable(tIdx, { relations: [...tables[tIdx].relations, emptyRelation(target)] });
  };
  const removeRelation = (tIdx: number, rIdx: number) =>
    updateTable(tIdx, { relations: tables[tIdx].relations.filter((_, j) => j !== rIdx) });

  const updateUniqueGroup = (tIdx: number, gIdx: number, raw: string) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      const groups = [...t.uniqueTogether];
      groups[gIdx] = raw.split(',').map(s => s.trim()).filter(Boolean);
      return { ...t, uniqueTogether: groups };
    }));
  };
  const addUniqueGroup = (tIdx: number) => updateTable(tIdx, { uniqueTogether: [...tables[tIdx].uniqueTogether, []] });
  const removeUniqueGroup = (tIdx: number, gIdx: number) =>
    updateTable(tIdx, { uniqueTogether: tables[tIdx].uniqueTogether.filter((_, j) => j !== gIdx) });

  const updateFetch = (tIdx: number, fIdx: number, patch: Partial<ExternalFetchSpec>) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      return { ...t, externalFetches: t.externalFetches.map((f, j) => (j === fIdx ? { ...f, ...patch } : f)) };
    }));
  };
  const addFetch = (tIdx: number) => updateTable(tIdx, { externalFetches: [...tables[tIdx].externalFetches, emptyFetch()] });
  const removeFetch = (tIdx: number, fIdx: number) =>
    updateTable(tIdx, { externalFetches: tables[tIdx].externalFetches.filter((_, j) => j !== fIdx) });

  const updateFetchQueryParams = (tIdx: number, fIdx: number, raw: string) =>
    updateFetch(tIdx, fIdx, { queryParams: raw.split(',').map(s => s.trim()).filter(Boolean) });

  const mappingRow = (tIdx: number, fIdx: number, rowIdx: number, key: string, value: string) => {
    const fetch = tables[tIdx].externalFetches[fIdx];
    const entries = Object.entries(fetch.responseMapping);
    entries[rowIdx] = [key, value];
    updateFetch(tIdx, fIdx, { responseMapping: Object.fromEntries(entries) });
  };
  const addMappingRow = (tIdx: number, fIdx: number) => {
    const fetch = tables[tIdx].externalFetches[fIdx];
    updateFetch(tIdx, fIdx, { responseMapping: { ...fetch.responseMapping, '': '' } });
  };
  const removeMappingRow = (tIdx: number, fIdx: number, key: string) => {
    const fetch = tables[tIdx].externalFetches[fIdx];
    const entries = Object.entries(fetch.responseMapping).filter(([k]) => k !== key);
    updateFetch(tIdx, fIdx, { responseMapping: Object.fromEntries(entries) });
  };

  const updateFn = (tIdx: number, fnIdx: number, patch: Partial<CustomFunctionSpec>) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      return { ...t, customFunctions: t.customFunctions.map((f, j) => (j === fnIdx ? { ...f, ...patch } : f)) };
    }));
  };
  const addFn = (tIdx: number, defaultActionType: string) =>
    updateTable(tIdx, { customFunctions: [...tables[tIdx].customFunctions, emptyCustomFunction(defaultActionType)] });
  const removeFn = (tIdx: number, fnIdx: number) =>
    updateTable(tIdx, { customFunctions: tables[tIdx].customFunctions.filter((_, j) => j !== fnIdx) });

  const updateFnParam = (tIdx: number, fnIdx: number, pIdx: number, patch: Partial<CustomFunctionParamSpec>) => {
    const fn = tables[tIdx].customFunctions[fnIdx];
    updateFn(tIdx, fnIdx, { parameters: fn.parameters.map((p, j) => (j === pIdx ? { ...p, ...patch } : p)) });
  };
  const addFnParam = (tIdx: number, fnIdx: number) => {
    const fn = tables[tIdx].customFunctions[fnIdx];
    updateFn(tIdx, fnIdx, { parameters: [...fn.parameters, emptyCustomFunctionParam()] });
  };
  const removeFnParam = (tIdx: number, fnIdx: number, pIdx: number) => {
    const fn = tables[tIdx].customFunctions[fnIdx];
    updateFn(tIdx, fnIdx, { parameters: fn.parameters.filter((_, j) => j !== pIdx) });
  };

  const updateStep = (tIdx: number, fnIdx: number, sIdx: number, patch: Partial<LogicStepSpec>) => {
    const fn = tables[tIdx].customFunctions[fnIdx];
    updateFn(tIdx, fnIdx, { logic: fn.logic.map((s, j) => (j === sIdx ? { ...s, ...patch } : s)) });
  };
  const addStep = (tIdx: number, fnIdx: number, defaultActionType: string) => {
    const fn = tables[tIdx].customFunctions[fnIdx];
    updateFn(tIdx, fnIdx, { logic: [...fn.logic, emptyLogicStep(defaultActionType)] });
  };
  const removeStep = (tIdx: number, fnIdx: number, sIdx: number) => {
    const fn = tables[tIdx].customFunctions[fnIdx];
    updateFn(tIdx, fnIdx, { logic: fn.logic.filter((_, j) => j !== sIdx) });
  };

  const stepParamRow = (tIdx: number, fnIdx: number, sIdx: number, rowIdx: number, key: string, value: string) => {
    const step = tables[tIdx].customFunctions[fnIdx].logic[sIdx];
    const entries = Object.entries(step.params);
    entries[rowIdx] = [key, value];
    updateStep(tIdx, fnIdx, sIdx, { params: Object.fromEntries(entries) });
  };
  const addStepParamRow = (tIdx: number, fnIdx: number, sIdx: number) => {
    const step = tables[tIdx].customFunctions[fnIdx].logic[sIdx];
    updateStep(tIdx, fnIdx, sIdx, { params: { ...step.params, '': '' } });
  };
  const removeStepParamRow = (tIdx: number, fnIdx: number, sIdx: number, key: string) => {
    const step = tables[tIdx].customFunctions[fnIdx].logic[sIdx];
    const entries = Object.entries(step.params).filter(([k]) => k !== key);
    updateStep(tIdx, fnIdx, sIdx, { params: Object.fromEntries(entries) });
  };

  return {
    tables, setTables, otherTableNames,
    updateTable, addTable, removeTable,
    updateColumn, addColumn, removeColumn,
    updateRelation, addRelation, removeRelation,
    updateUniqueGroup, addUniqueGroup, removeUniqueGroup,
    updateFetch, addFetch, removeFetch, updateFetchQueryParams, mappingRow, addMappingRow, removeMappingRow,
    updateFn, addFn, removeFn, updateFnParam, addFnParam, removeFnParam,
    updateStep, addStep, removeStep, stepParamRow, addStepParamRow, removeStepParamRow,
  };
}

export type TableSpecOps = ReturnType<typeof useTableSpecs>;
