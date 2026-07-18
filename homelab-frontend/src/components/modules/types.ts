//TODO: move renderer and binding in their own files
export type RendererContext = Record<string, unknown>;

export type HttpMethod = 'GET' | 'POST';
export type RendererResourceStatus = 'idle' | 'loading' | 'ready' | 'error';

export type BindingRequestPayload = FormData | Record<string, unknown>;

export interface BindingRequest {
  binding: string;
  method: HttpMethod;
  params?: BindingRequestPayload;
}

export interface BindingSource {
  binding: string;
  method: HttpMethod;
  params?: Record<string, unknown>;
}

export interface RendererResource {
  status: RendererResourceStatus;
  data?: unknown;
  error?: unknown;
  request: BindingRequest;
  updatedAt?: number;
}

export type RendererResourceMap = Record<string, RendererResource | undefined>;

export interface StateTransition {
  setState?: Record<string, unknown>;
}

export interface SetStateAction {
  type: 'setState';
  target: string;
  value: unknown;
}

export interface BindingAction {
  action: string;
  method: HttpMethod;
  params?: Record<string, unknown>;
  then?: StateTransition;
}

export type ComponentAction = SetStateAction | BindingAction;
export type ActionConfig = ComponentAction | ComponentAction[];

//TODO: move to it's own file 
export interface HeaderComponent {
  type: 'Header';
  props: {
    title: string;
  };
}

export interface ActionBarComponent {
  type: 'ActionBar';
  components: RendererComponent[];
}

export interface ButtonComponent {
  type: 'Button';
  props: {
    label: string;
    icon?: string;
    uploadTarget?: string;
  };
  action?: ActionConfig;
}

export interface IconButtonComponent {
  type: 'IconButton';
  props: {
    icon: string;
    tooltip?: string;
  };
  action?: ActionConfig;
}

export interface FileUploadZoneComponent {
  type: 'FileUploadZone';
  props?: {
    id?: string;
    accept?: string;
    multiple?: boolean;
  };
  action?: ActionConfig;
}

export interface ListItemComponent {
  type: 'ListItem';
  props: {
    title: string;
    subtitle?: string;
    clickable?: boolean;
  };
  defaultClick?: ActionConfig;
  onClick?: ActionConfig;
  actions?: RendererComponent[];
}

export interface ListComponent {
  type: 'List';
  props?: {
    emptyMessage?: string;
  };
  source: BindingSource;
  item: ListItemComponent;
}

export interface ElementListComponent {
  type: 'ElementList';
  props?: {
    emptyMessage?: string;
  };
  source: BindingSource;
  preview?: ImageViewerComponent | MediaPlayerComponent;
  item: ListItemComponent;
}

export interface ReaderCarouselComponent {
  type: 'ReaderCarousel';
  /** Optional source to fetch the list of items (groupContent) */
  source?: BindingSource;
  /** Optional params forwarded to the source */
  params?: Record<string, unknown>;
  props?: {
    /** field name on item that contains image URL */
    itemImageField?: string;
    /** state key used for fullscreen id (default: fullscreenPhotoId) */
    fullscreenStateKey?: string;
  };
}

export interface ImageViewerComponent {
  type: 'ImageViewer';
  source?: BindingSource;
  params?: Record<string, unknown>;
  props?: {
    src?: string;
    alt?: string;
    displayViewerMode?: 'light' | 'full'; // ← add this
  };
}

export interface MediaPlayerComponent {
  type: 'MediaPlayer';
  source?: BindingSource;
  params?: Record<string, unknown>;
  props?: {
    src?: string;
    mediaType?: 'audio' | 'video';
    displayViewerMode?: 'light' | 'full';
    autoPlay?: boolean;
    loop?: boolean;
  };
}

export interface ModalComponent {
  type: 'Modal';
  visible: string | boolean;
  title?: string;
  content?: RendererComponent;
  actions?: RendererComponent[];
}

export interface TextInputComponent {
  type: 'TextInput';
  props: {
    placeholder?: string;
    label?: string;
    stateKey: string;
    buttonLabel?: string;
  };
  action?: ActionConfig;
}

export interface CodeBlockComponent {
  type: 'CodeBlock';
  props?: {
    lang?: string;
  };
  source?: BindingSource;
  params?: Record<string, unknown>;
}
//

export type RendererComponent =
  | HeaderComponent
  | ActionBarComponent
  | ButtonComponent
  | IconButtonComponent
  | FileUploadZoneComponent
  | ListComponent
  | ElementListComponent
  | ReaderCarouselComponent
  | ListItemComponent
  | ModalComponent
  | ImageViewerComponent
  | MediaPlayerComponent
  | TextInputComponent
  | CodeBlockComponent;

export type RendererComponentType = RendererComponent['type'];

export interface ModulePageConfig {
  id: string;
  layout?: string;
  bindings?: Record<string, string>;
  state?: RendererContext;
  components: RendererComponent[];
}

export interface ModulePagePayload {
  page: ModulePageConfig;
}

export interface JsonModulePageResponse {
  type: 'json';
  content: unknown;
}

export interface StandaloneModulePageResponse {
  type: 'standalone';
  content: string;
}

export type ModulePageResponse =
  | JsonModulePageResponse
  | StandaloneModulePageResponse;

const normalizeBindingKeyValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeBindingKeyValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((acc, [key, entry]) => {
        acc[key] = normalizeBindingKeyValue(entry);
        return acc;
      }, {});
  }

  return value;
};

const serializeBindingKeyParams = (params?: BindingRequestPayload | Record<string, unknown>): string => {
  if (!params) {
    return '';
  }

  if (params instanceof FormData) {
    return '__formdata__';
  }

  return JSON.stringify(normalizeBindingKeyValue(params));
};

export const isModulePageConfig = (value: unknown): value is ModulePageConfig => {
  if (!value || typeof value !== 'object') {
    console.warn('Invalid module page config: not an object', value);
    return false;
  }

  const candidate = value as Partial<ModulePageConfig>;
  return typeof candidate.id === 'string' && Array.isArray(candidate.components);
};

export const extractModulePageConfig = (
  value: unknown
): ModulePageConfig | null => {
  if (isModulePageConfig(value)) {
    return value;
  }
  if (
    value &&
    typeof value === 'object' &&
    'page' in value &&
    isModulePageConfig((value as ModulePagePayload).page)
  ) {
    return (value as ModulePagePayload).page;
  }

  return null;
};

export const getBindingKey = (
  source: Pick<BindingRequest, 'binding' | 'params'> | BindingSource,
  moduleId?: string,
): string => {
  const serializedParams = serializeBindingKeyParams(source.params);
  const prefix = moduleId ? `${moduleId}:` : '';

  return serializedParams
    ? `${prefix}${source.binding}::${serializedParams}`
    : `${prefix}${source.binding}`;
};