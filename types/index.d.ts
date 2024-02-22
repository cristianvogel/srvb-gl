// Type definitions for
// Project: NEL-VCS-24

export type Parameter = {
  paramId: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

export type LocalManifest = {
  window: { width: number; height: number };
  parameters: Parameter[];
  NUMBER_NODES: number;
  NUMBER_PARAMS: number;
  sampleRate?: number;
  viewState?: any;
};

//------------- Native Interops -------------------
export type NativeMessages = {
  setViewState(value: any);
  requestParamValueUpdate(paramId: string, value: number): void;
  registerMessagesFromHost(): void;
  requestReady(): void;
};

//------------- Finite States -------------------

export interface StatesArrayActions {
  toggleNode: (nodeId: number, state?: NodeState) => void;
}

export type NodeState = ReturnType<typeof createNodeStateFSM>;
