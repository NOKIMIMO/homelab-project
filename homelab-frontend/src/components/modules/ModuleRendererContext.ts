import { createContext } from 'react';
import type {
  BindingRequest,
  BindingSource,
  RendererContext,
  RendererResourceMap,
} from './types';

export interface ModuleRendererContextValue {
  baseContext: RendererContext;
  moduleId?: string;
  resources: RendererResourceMap;
  runBinding: (request: BindingRequest) => Promise<unknown>;
  preloadSource: (source: BindingSource) => Promise<unknown>;
  setStateValue: (key: string, value: unknown) => void;
}

export const ModuleRendererContext = createContext<ModuleRendererContextValue | null>(null);