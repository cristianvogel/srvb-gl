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
  UI_Preset,
  StorageFSM,
  UI_Slider,
  HostParameter,
  UI_ParameterController,
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
export const FrameCount: Writable<number> = writable(0);

//---- Interpolation related stores -------------------

export const CurrentVectorInterp: Writable<Vec> = writable([0, 0, 0]);


// ---- native interops -------------------

export const NativeMessage: Writable<NativeMessages> = writable({
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
  // register messages sent from the host
  registerMessagesFromHost: function () {
    globalThis.__receiveStateChange__ = function (state: any) {
      // trigger FSM transition
      UpdateStateFSM.updateFrom("host");
      // then deserialize and store the received state
      HostState.set(JSON.parse(state)); // deserialization esssential
    };
    globalThis.__receiveError__ = function (error: any) {
      // do something more useful here?
      ErrorStore.set(error);
    };
  },
  // send a ready message to the host
  requestReady: function () {
    if (typeof globalThis.__postNativeMessage__ === "function") {
      globalThis.__postNativeMessage__("ready", {});
    }
  },
});

//-----------------  UI defs and parameters -------------------

const NUMBER_NODES = 36;
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

export const CurrentControlSettings: Writable<UI_Slider[]> = writable([]);
//---- registered audio parameters -------------------
export const ParamDefsHost: Writable<HostParameter[]> = writable(
  manifest.parameters
);
// registered audio parameters for UI
export const ParamIds: Writable<string[]> = writable(
  manifest.parameters.map((p: HostParameter) => p.paramId)
);

//--- parameter and presets stores -------------------
export interface LocksStoreEntry {
  [key: string]: number;
}

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
export const UI_StoredPresets: Writable<UI_Preset[]> = writable(
  Array(NUMBER_NODES).fill({ index: -1, name: "-1", parameters: {} })
);
// Sidebar controls
//export const UI_Controls: Writable<UI_ParameterController[]> = writable();
export const UI_Controls: Writable<Map<string, UI_Slider>> = writable(new Map());

// Global export of current RayCast target
export const CurrentPickedId: Writable<number> = writable(0);
export const CurrentFocusId: Writable<number> = writable(0);
// // todo: annotate, this holds UI control panel parameters
// export const UI_Params: Writable<any> = writable({})

// a console for debugging or user feedback
export const ConsoleText: Writable<string> = writable("Console:");

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

// global helper function for the array of FSMs
export const getNodeStateAs = {
  number: (index: number) => {
    return Number(String(get(get(UI_StorageFSMs)[index])) === "filled" ? 1 : 0);
  },
  key: (index: number) => {
    return String(get(get(UI_StorageFSMs)[index]));
  },
};

// ⤵︎ Factory object for simple toggle to lock a parameter in the UI
export const LockIcon: Readable<any> = readable({ LOCKED: "〇", OPEN: "◉" });

const icon: any = get(LockIcon);
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
      (this.set as unknown as Debounced).debounce(2);
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
        console.log( "assigning colors " )
        colors = c;
      },
      paint(eventObject) {
        eventObject.color.set(colors.base);
        return "empty";
      },
      fill(eventObject) {
        eventObject.color.set(colors.highlighted);
        return "filled";
      },
    },
    filled: {
      assign(c) {
        colors = c;
      },
      paint(eventObject) {
        eventObject.color.set(colors.highlighted);
        return "filled";
      },
    
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
        console.log( 'store preset data', p )
        get(UI_StoredPresets)[index] = p;
        return "filled";
      },

      resetTo(state) {
        return state;
      },
    },
    filled: {
      randomise() {
        return Math.random() > 0.5 ? "filled" : "empty";
      },
      getPreset(i) {
        return get(UI_StoredPresets)[i];
      }, 
      storePreset(p) {
        get(UI_StoredPresets)[index] = p;
        return "filled";
      },
      resetTo(state) {
        return state;
      },
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
export const HostState: Writable<any> = writable();
export const ErrorStore: Writable<any> = writable();

//---- other stuff -------------------
export const PixelDensity: Writable<number> = writable(2);

// todo;;;; look at this?
// specify an empty object with valid param keys for the locks store
// otherwise the UI will break
const emptyLocksObject: LocksStoreEntry = {};
for (const paramId of get(ParamIds)) {
  emptyLocksObject[paramId] = 0;
}
export const LocksStore: Writable<{}> = writable(emptyLocksObject);
