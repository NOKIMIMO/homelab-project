import type {
  ActionConfig,
  BindingAction,
  BindingSource,
  ComponentAction,
  RendererComponent,
  SetStateAction,
} from './../types';

export const isRendererRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isSetStateAction = (action: ComponentAction): action is SetStateAction =>
  typeof action === 'object' &&
  action !== null &&
  'type' in action &&
  action.type === 'setState';

export const isBindingAction = (action: ComponentAction): action is BindingAction =>
  typeof action === 'object' && action !== null && 'action' in action;

export const hasSource = (
  config: RendererComponent,
): config is Extract<RendererComponent, { source: BindingSource }> =>
  'source' in config &&
  typeof config.source === 'object' &&
  config.source !== null;

export const hasComponents = (
  config: RendererComponent,
): config is Extract<RendererComponent, { components: RendererComponent[] }> =>
  'components' in config;

export const hasActions = (
  config: RendererComponent,
): config is Extract<RendererComponent, { actions?: RendererComponent[] }> =>
  'actions' in config;

export const hasContent = (
  config: RendererComponent,
): config is Extract<RendererComponent, { content?: RendererComponent }> =>
  'content' in config;

export const hasAction = (
  config: RendererComponent,
): config is Extract<RendererComponent, { action?: ActionConfig }> =>
  'action' in config;

export const hasDefaultClick = (
  config: RendererComponent,
): config is Extract<RendererComponent, { defaultClick?: ActionConfig }> =>
  'defaultClick' in config;
