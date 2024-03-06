declare var globalThis: any;

import {
  get,
  readable,
  writable,
  type Readable,
  type Writable,
} from "svelte/store";
import fsm from "svelte-fsm";

import type {
  ClassFSM,
  LocalManifest,
  NativeMessages,
  NodeLoadState,
  StorageFSM,
  HostParameter,
  UI_ControlsMap,
} from "../../types";
import type { Vector2Tuple } from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { Vec } from "@thi.ng/vectors";

//-------- new Threlte related stores --------------------
export const RayCastPointerPosition: Writable<Vector2Tuple> = writable([0, 0]);
export const ShowMiniBars: Writable<boolean> = writable(false);
export const CSSRenderer: Writable<CSS2DRenderer> = writable(
  new CSS2DRenderer()
);
export const Accumulator: Writable<number> = writable(0);

//---- Interpolation related stores -------------------

export const CurrentVectorInterp: Writable<Vec> = writable([0, 0, 0]);

// ---- native interops -------------------

export const NativeMessage: Writable<NativeMessages> = writable({
  //// Sending messages to the host

  // store any persistent UI state in the host
  // serialisation happens here
  setViewState: function (viewState: any) {
    if (typeof globalThis.__postNativeMessage__ === "function") {
      console.log("sending view state to host", JSON.stringify(viewState));
      globalThis.__postNativeMessage__(
        "setViewState",
        JSON.stringify(viewState)
      );
    }
  },
  // update parameter values in the host
  requestParamValueUpdate: function (paramId: string, value: number) {
    // trigger FSM transition
    if (
      typeof globalThis.__postNativeMessage__ === "function" &&
      get(UpdateStateFSM) !== "updatingUI"
    ) {
      UpdateStateFSM.updateFrom("ui");
      //@ts-ignore
      globalThis.__postNativeMessage__("setParameterValue", {
        paramId,
        value,
      });
    }
  },
  // send a ready message to the host
  requestReady: function () {
    if (typeof globalThis.__postNativeMessage__ === "function") {
      globalThis.__postNativeMessage__("ready", {});
    }
  },
  //// Receiving messages from the host
  // register messages sent from the host
  registerMessagesFromHost: function () {
    if (get(UpdateStateFSM) !== "updatingHost") {
      globalThis.__receiveStateChange__ = function (state: any) {
        // trigger FSM transition
        UpdateStateFSM.updateFrom("host");
        // then deserialize and store the received state as a Map
        // Transpose incoming state which has the form of  <k,v>
        const entries: any = Object.entries(JSON.parse(state));
        // into a TS Map and store in HostState
        HostState.set(new Map(entries));
      };

      // error handling
      globalThis.__receiveError__ = function (error: any) {
        // do something more useful here?
        ErrorStore.set(error);
      };
    }
  },
});

//-----------------  UI defs and parameters -------------------

const NUMBER_NODES = 8 * 8;
export const manifest: LocalManifest = {
  NUMBER_NODES,
  NUMBER_PARAMS: 4,
  window: {
    width: 800,
    height: 444,
  },
  // ---- Parameters  -------------------
  // The order of Entries in the parameters object her
  // should match the order of the parameters in the UI (not the host)
  parameters: [
    { paramId: "decay", name: "Decay", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "mix", name: "Mix", min: 0.0, max: 1.0, defaultValue: 1.0 },
    { paramId: "mod", name: "Mod", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "size", name: "Size", min: 0.0, max: 1.0, defaultValue: 0.5 },
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

//--- FSMs -----------------------------------------
// Finite   ⤵︎
// State    ⤵︎
// Machines ⤵︎
// ⤵︎ local helper functions and types
export type FSM = ReturnType<typeof fsm>;
export type NodeStateFSM = ReturnType<typeof createNodeStateFSM>;
interface Debounced {
  debounce: (delay: number) => void;
}
function debounce(context: FSM, transition: string, delay: number) {
  (context[transition] as unknown as Debounced).debounce(delay);
  //console.count("debounce function");
}

// global helper function for array of FSMs
export const getNodeStateAs = {
  number: (index: number) => {
    return Number(String(get(get(UI_StorageFSMs)[index])) === "filled" ? 1 : 0);
  },
  key: (index: number) => {
    return String(get(get(UI_StorageFSMs)[index]));
  },
};

// simple toggle to lock a parameter in the UI
export const LockIcon: Readable<any> = readable({ LOCKED: "〇", OPEN: "◉" });
const icon: any = get(LockIcon);
// ⤵︎ Factory FSM object
export const createLockFSM = function (): FSM {
  //@ts-ignore
  return fsm(icon.OPEN, {
    [icon.LOCKED]: {
      toggle(): string {
        return icon.OPEN;
      },
    },
    [icon.OPEN]: {
      toggle(): string {
        return icon.LOCKED;
      },
    },
  });
};

export const LocksMap: Writable<Map<Element | string, FSM | boolean>> =
  writable(new Map());

// ⤵︎ Machine for handling UI to Host communication

export const UpdateStateFSM = fsm("ready", {
  ready: {
    updateFrom(src) {
      if (src === "host") return "updatingUI";
      if (src === "ui") return "updatingHost";
    },
  },
  updatingHost: {
    _enter() {
      (this.set as unknown as Debounced).debounce(1);
    },
    set: "ready",
  },
  updatingUI: {
    _enter() {
      (this.set as unknown as Debounced).debounce(1);
    },
    set: "ready",
  },
});

export function createNodeClassFSM(colors: any, index: number) {
  return fsm("empty", {
    empty: {
      assign(c) {
        colors = c;
      },
      paint(eventObject) {
        eventObject.color.set(colors.base);
        return "empty";
      },
      fill(eventObject?) {
       if (eventObject) eventObject.color.set(colors.highlighted);
        return "filled";
      }
    },
    filled: {
      assign(c) {
        colors = c;
      },
      paint(eventObject) {
        eventObject.color.set(colors.highlighted);
        return "filled";
      },
      empty(eventObject?) {
        if (eventObject) eventObject.color.set(colors.base);
        return "empty";
      }
    },
  });
}

// ⤵︎ Factory function for making Machines that manage state of presets in the GUI
export function createNodeStateFSM(initial: NodeLoadState, index: number) {
  return fsm(initial, {
    empty: {
      randomise() {
        return Math.random() > 0.5 ? "filled" : "empty";
      },
      storePreset(p) {
        console.log("store preset data", p);
        get(UI_StoredPresets)[index] = new Map(p);
        return "filled";
      },
      clearPreset() {
        get(UI_StoredPresets)[index] = new Map();
        return "empty";
      },
      resetTo(state) {
        return state;
      },
    },
    filled: {
      randomise() {
        return Math.random() < 0.5 ? "filled" : "empty";
      },
      getPreset(i) {
        return get(UI_StoredPresets)[i];
      },
      storePreset(p) {
        get(UI_StoredPresets)[index] = new Map(p);
        return "filled";
      },
      resetTo(state) {
        return state;
      },
      clearPreset() {
        get(UI_StoredPresets)[index] = new Map();
        return "empty";
      }
    },
  });
}

// ⤵︎ Machine for Console Text

let count = 0;
let duration = 3000;
const prompts = [
  `Grid with ${manifest.NUMBER_NODES} nodes of ${manifest.NUMBER_PARAMS} parameters.`,
  "Store some presets.",
  "Morph between them.",
  "Ready.",
];

function enterPrompt(this: FSM) {
  ConsoleText.set(prompts[count++]);
  debounce(this, "next", duration);
}

export const ConsoleFSM = fsm("start", {
  start: {
    _enter: enterPrompt,
    next: "prompt_2",
  },
  prompt_2: {
    _enter: enterPrompt,
    next: "prompt_3",
  },
  prompt_3: {
    _enter: enterPrompt,
    next: "finish",
  },
  finish: {
    _enter() {
      count = prompts.length;
      ConsoleText.set(prompts.at(-1) as string);
    },
    reset() {
      count = 0;
      return "start";
    },
    log(msg) {
      ConsoleText.set(msg);
    },
  },
});

// ---- state synchronisation -------------------

// custom store that holds received host state
export const HostState: Writable<Map<string, any>> = writable();
export const ErrorStore: Writable<any> = writable();

//---- other stuff -------------------
export const PixelDensity: Writable<number> = writable(2);
