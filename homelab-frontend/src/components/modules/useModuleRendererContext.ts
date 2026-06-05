import { useContext } from 'react';
import { ModuleRendererContext } from './ModuleRendererContext';

export function useModuleRendererContext() {
  const context = useContext(ModuleRendererContext);

  if (!context) {
    throw new Error('useModuleRendererContext must be used within ModuleRendererProvider');
  }

  return context;
}
