import React from 'react';
import { isBindingAction, isSetStateAction } from './componentRendererGuards';
import type {
  ActionConfig,
  BindingRequest,
  BindingRequestPayload,
  ComponentAction,
  RendererContext,
} from './../types';

interface UseActionHandlerOptions {
  renderContext: RendererContext;
  actionRunner: (action: BindingRequest) => void | Promise<unknown>;
  stateWriter: (key: string, value: unknown) => void;
  resolveValue: (value: unknown, scope?: RendererContext) => unknown;
  resolveRecord: (value: Record<string, unknown>) => Record<string, unknown>;
}


export const useActionHandler = ({
  renderContext,
  actionRunner,
  stateWriter,
  resolveValue,
  resolveRecord,
}: UseActionHandlerOptions) => {
  const executeAction = React.useCallback(
    async (action: ComponentAction, params?: BindingRequestPayload) => {
      if (isSetStateAction(action)) {
        stateWriter(action.target, resolveValue(action.value));
        return;
      }

      if (isBindingAction(action)) {
        const resolvedActionParams = action.params
          ? resolveRecord(action.params)
          : params;

        const result = await actionRunner({
          binding: action.action,
          method: action.method,
          params: resolvedActionParams,
        });

        if (action.then?.setState) {
          const nextScope: RendererContext = { ...renderContext, result };
          Object.entries(action.then.setState).forEach(([target, value]) => {
            stateWriter(target, resolveValue(value, nextScope));
          });
        }
      }
    },
    [actionRunner, renderContext, resolveRecord, resolveValue, stateWriter],
  );

  const handleAction = React.useCallback(
    async (actionConfig: ActionConfig, params?: BindingRequestPayload) => {
      const actions = Array.isArray(actionConfig) ? actionConfig : [actionConfig];

      for (const [index, action] of actions.entries()) {
        const runtimeParams = index === 0 ? params : undefined;
        await executeAction(action, runtimeParams);
      }
    },
    [executeAction],
  );

  return handleAction;
};
