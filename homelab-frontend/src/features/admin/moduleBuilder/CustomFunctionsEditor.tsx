import { Plus, Trash2 } from 'lucide-react';
import type { CustomFunctionSpec, ModuleActionParameterType } from '@app/types';
import { ACTION_PARAM_TYPES } from './formDefaults';
import type { TableSpecOps } from './useTableSpecs';

interface Props {
  tIdx: number;
  functions: CustomFunctionSpec[];
  availableActionTypes: string[];
  ops: Pick<TableSpecOps,
    | 'updateFn' | 'addFn' | 'removeFn'
    | 'updateFnParam' | 'addFnParam' | 'removeFnParam'
    | 'updateStep' | 'addStep' | 'removeStep'
    | 'stepParamRow' | 'addStepParamRow' | 'removeStepParamRow'
  >;
}

export default function CustomFunctionsEditor({ tIdx, functions, availableActionTypes, ops }: Props) {
  const defaultActionType = availableActionTypes[0] ?? '';

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Fonctions personnalisées</p>
      {functions.map((fn, fnIdx) => (
        <div key={fnIdx} className="border border-base-content/10 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className="input input-bordered input-xs flex-1 font-mono"
              placeholder="nomDeLaFonction"
              value={fn.name}
              onChange={e => ops.updateFn(tIdx, fnIdx, { name: e.target.value })}
            />
            <input
              className="input input-bordered input-xs flex-[2]"
              placeholder="Description"
              value={fn.description}
              onChange={e => ops.updateFn(tIdx, fnIdx, { description: e.target.value })}
            />
            <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeFn(tIdx, fnIdx)}>
              <Trash2 size={12} />
            </button>
          </div>

          {/* Declared input parameters */}
          <div className="space-y-1">
            <p className="text-[11px] opacity-50">Paramètres déclarés (fournis par l'appelant)</p>
            {fn.parameters.map((p, pIdx) => (
              <div key={pIdx} className="flex items-center gap-2">
                <input
                  className="input input-bordered input-xs flex-1 font-mono"
                  placeholder="nom"
                  value={p.name}
                  onChange={e => ops.updateFnParam(tIdx, fnIdx, pIdx, { name: e.target.value })}
                />
                <select
                  className="select select-bordered select-xs"
                  value={p.type}
                  onChange={e => ops.updateFnParam(tIdx, fnIdx, pIdx, { type: e.target.value as ModuleActionParameterType })}
                >
                  {ACTION_PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={!p.optional}
                    onChange={e => ops.updateFnParam(tIdx, fnIdx, pIdx, { optional: !e.target.checked })}
                  />
                  requis
                </label>
                <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeFnParam(tIdx, fnIdx, pIdx)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addFnParam(tIdx, fnIdx)}>
              <Plus size={12} /> Paramètre
            </button>
          </div>

          {/* Ordered sequence of action steps */}
          <div className="space-y-1">
            <p className="text-[11px] opacity-50">Séquence d'actions (exécutées dans l'ordre)</p>
            {fn.logic.map((step, sIdx) => (
              <div key={sIdx} className="border border-base-content/10 rounded-lg p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] opacity-40 w-4">{sIdx + 1}.</span>
                  <select
                    className="select select-bordered select-xs flex-1"
                    value={step.actionType}
                    onChange={e => ops.updateStep(tIdx, fnIdx, sIdx, { actionType: e.target.value })}
                  >
                    {availableActionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeStep(tIdx, fnIdx, sIdx)}>
                    <Trash2 size={12} />
                  </button>
                </div>
                {Object.entries(step.params).map(([key, value], rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-2 pl-6">
                    <input
                      className="input input-bordered input-xs flex-1 font-mono"
                      placeholder="clé"
                      value={key}
                      onChange={e => ops.stepParamRow(tIdx, fnIdx, sIdx, rowIdx, e.target.value, value)}
                    />
                    <input
                      className="input input-bordered input-xs flex-1 font-mono"
                      placeholder="valeur"
                      value={value}
                      onChange={e => ops.stepParamRow(tIdx, fnIdx, sIdx, rowIdx, key, e.target.value)}
                    />
                    <button
                      className="btn btn-xs btn-ghost btn-error"
                      onClick={() => ops.removeStepParamRow(tIdx, fnIdx, sIdx, key)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn-xs btn-outline gap-1 ml-6"
                  onClick={() => ops.addStepParamRow(tIdx, fnIdx, sIdx)}
                >
                  <Plus size={12} /> Param fixe
                </button>
              </div>
            ))}
            <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addStep(tIdx, fnIdx, defaultActionType)}>
              <Plus size={12} /> Étape
            </button>
          </div>
        </div>
      ))}
      <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addFn(tIdx, defaultActionType)}>
        <Plus size={12} /> Fonction personnalisée
      </button>
    </div>
  );
}
