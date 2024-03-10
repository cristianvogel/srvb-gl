
import {
  writable,
  type Writable,
} from "svelte/store";

import type {
  ClassFSM,
  LocalManifest,
  StorageFSM,
  HostParameter,
  UI_ControlsMap,
} from "../../types";
import type { Vector2Tuple } from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { Vec } from "@thi.ng/vectors";

//-----------------  UI defs and parameters -------------------

const NUMBER_NODES = 8 * 8;
export const manifest: LocalManifest = {
  NUMBER_NODES,
  NUMBER_PARAMS: 4,
  window: {
    width: 575,
    height: 930,
  },
  // ---- Parameters  -------------------
  // The order of Entries in the parameters object here
  // should match the order of the parameters in the UI (not the host)
  parameters: [
    { paramId: "decay", name: "Decay", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "mix", name: "Mix", min: 0.0, max: 1.0, defaultValue: 1.0 },
    { paramId: "mod", name: "Mod", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "size", name: "Size", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "shift", name: "Shift", min: 0.0, max: 0.5, defaultValue: 0.0 }
  ],
  viewState: new Array(NUMBER_NODES).fill(0),
};

//---- registered audio parameters -------------------
export const ParamDefsHost: Writable<HostParameter[]> = writable(
  manifest.parameters
);
// registered audio parameters for UI
export const ParamIds: Writable<string[]> = writable(
  manifest.parameters.map((p: HostParameter) => p.paramId)
);

//--- parameter and presets stores -------------------

export interface UINodeStyle {
  base: string | THREE.Color;
  highlighted?: string | THREE.Color;
  [key: string]: string | THREE.Color | undefined;
}

// Create a state machine and referenced stores for each node
// that will be used to track whether the node is holding
// stored preset values, its color state, and other actions.
//
// Main store will be filled with initialising constructor
export const UI_StorageFSMs: Writable<StorageFSM[]> = writable([]);
// Seperate store for Class and Styles
export const UI_ClassFSMs: Writable<ClassFSM[]> = writable([]);
// Seperate store for Presets
export const UI_StoredPresets: Writable<UI_ControlsMap[]> = writable(
  Array(NUMBER_NODES).fill(new Map())
);
// Sidebar controls
export const UI_Controls: Writable<UI_ControlsMap> = writable(new Map());

//--- Raycaster -----------------------------------------
// Global export of current RayCast target
export const CurrentPickedId: Writable<number> = writable(0);
export const CurrentFocusId: Writable<number> = writable(0);

//--- Console -----------------------------------------
// a console for debugging or user feedback
export const ConsoleText: Writable<string> = writable("Console:");

// ---- state synchronisation -------------------

// custom store that holds received host state
export const HostState: Writable<Map<string, any>> = writable();
export const ErrorStore: Writable<any> = writable();

//-------- new Threlte related stores --------------------
export const RayCastPointerPosition: Writable<Vector2Tuple> = writable([0, 0]);
export const ShowMiniBars: Writable<boolean> = writable(false);
export const CSSRenderer: Writable<CSS2DRenderer> = writable(
  new CSS2DRenderer()
);
export const Accumulator: Writable<number> = writable(-1);

//---- Interpolation related stores -------------------
export const CurrentVectorInterp: Writable<Vec> = writable([0, 0, 0]);

//---- other stuff -------------------
export const PixelDensity: Writable<number> = writable(2);
