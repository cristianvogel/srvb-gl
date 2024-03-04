// Type definitions for
// Project: NEL-VCS-24

import type { Color, Object3D } from "three";
import type { UINodeStyle } from "../src/stores/stores";

export type HostParameter = {
  paramId: any;
  name?: string;
  value?: number;
  min?: number;
  max?: number;
  defaultValue?: number;
};

export type UI_ControlsMap = Map<string, UI_Slider>;

export interface UI_ParameterController {
 [paramId: string]:  UI_Slider
};

export type UI_Slider = {
  index: number ;
  min: number | undefined;
  max: number | undefined;
  value: number | undefined;
  step: number | undefined;
};

export interface UI_Preset {
  index: number;
  name?: string;
  color?: UINodeStyle;
  parameters: UI_ControlsMap;
  eventObject?: Object3D;
  getParameterValues?: () => Vec;
  setParameterValues?: (values: Vec) => void;
};

export type LocalManifest = {
  window: { width: number; height: number };
  parameters: HostParameter[];
  NUMBER_NODES: number;
  NUMBER_PARAMS: number;
  sampleRate?: number;
  viewState?: any;
};


// export type ParameterDef = {
//   paramId: any;
//   value: number;
//   [key: string]: any;
// };



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



