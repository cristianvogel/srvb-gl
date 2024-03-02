// Type definitions for
// Project: NEL-VCS-24

import type { Color, Object3D } from "three";
import type { UINodeStyle } from "../src/stores/stores";

export type HostParameterDefinition = {
  paramId: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

export type LocalManifest = {
  window: { width: number; height: number };
  parameters: HostParameterDefinition[];
  NUMBER_NODES: number;
  NUMBER_PARAMS: number;
  sampleRate?: number;
  viewState?: any;
};

export type UIParameterDefinition = {
  min: number;
  max: number;
  value: number;
  step: number;
};

export type Parameter = {
  paramId: string;
  label?: string;
  name: string;
  value: number;
};

export type Preset = {
  index: number;
  name?: string;
  color?: UINodeStyle;
  parameters: Parameter[];
  eventObject: Object3D;
};

export type NodeLoadState = 'empty' | 'filled' 

export type StorageFSM = ReturnType<typeof createNodeStateFSM>;
export type ClassFSM = ReturnType<typeof createNodeClassFSM>;

//------------- Native Interops -------------------
export type NativeMessages = {
  setViewState(value: any);
  requestParamValueUpdate(paramId: string, value: number): void;
  registerMessagesFromHost(): void;
  requestReady(): void;
};

//------------- Finite States -------------------



