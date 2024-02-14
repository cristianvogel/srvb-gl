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
  ui_numberOfNodes: number;
};

//------------- Native Interops -------------------
export type NativeMessages = {
  requestParamValueUpdate(paramId: string, value: number): void;
  registerMessagesFromHost(): void;
  requestReady(): void;
};

//------------- Finite States -------------------
// Define the type for the return of node state machine
export type NodeState = ReturnType<typeof createNodeStateFSM>;
