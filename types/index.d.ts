// Type definitions for
// Project: NEL-VCS-24

import type { Color, Object3D } from "three";
import type { UINodeStyle } from "../src/stores/stores";

export type HostParameterMap = {

  [key: string]: any;
  paramId: any;
  value: number;
};

export type LocalManifest = {
  window: { width: number; height: number };
  parameters: any[];
  NUMBER_NODES: number;
  NUMBER_PARAMS: number;
  sampleRate?: number;
  viewState?: any;
};

export type GenericUIParamSettings = {
  min: number;
  max: number;
  value: number;
  step: number;
};

export type ParameterDef = {
  paramId: any;
  value: number;
  [key: string]: any;
};

export type Preset = {
  index?: number;
  name?: string;
  color?: UINodeStyle;
  parameters: HostParameterMap;
  eventObject?: Object3D;
  getParameterValues: () => Vec;
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



