// Type definitions for
// Project: NEL-VCS-24

import type { Color } from "three";

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
  color?: Color;
  parameters: Parameter[];
};

export type NodeLoadState = 'empty' | 'filled' 

//------------- Native Interops -------------------
export type NativeMessages = {
  setViewState(value: any);
  requestParamValueUpdate(paramId: string, value: number): void;
  registerMessagesFromHost(): void;
  requestReady(): void;
};

//------------- Finite States -------------------



