declare var globalThis: any;

import { get, writable, type Writable } from "svelte/store";
import fsm from "svelte-fsm";
import type { Parameter, LocalManifest, NativeMessages } from "../../types";

//---- Cables  -------------------
export const CablesPatch: Writable<any> = writable();
export const CablesParams: Writable<any> = writable();

// reference to public/Manifest.json
// used by the native side for audio updates
// not sure how to import this dynamically at build time!
// Also sure to make it reflect public/manifest.json if that
// gets updated

export const manifest: LocalManifest = {
  NUMBER_NODES: 36,
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
};

// a console for debugging or user feedback
export const ConsoleText: Writable<string> = writable("Console:");

// Finite   ⤵︎
// State    ⤵︎
// Machines ⤵︎
// ⤵︎ local helper functions and types
type FSM = ReturnType<typeof fsm>;
interface Debounced {
  debounce: (delay: number) => void;
}
function debounce(context: FSM, transition: string, delay: number) {
  (context[transition] as unknown as Debounced).debounce(delay);
  //console.count("debounce function");
}

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

// ⤵︎ Factory function for making Machines that manage state of presets in the GUI
export const createNodeStateFSM = function (): FSM {
  return fsm("empty", {
    empty: {
      toggle() {
        return "filled";
      },
      randomise() {
        return Math.random() > 0.5 ? "filled" : "empty";
      },
    },
    filled: {
      toggle() {
        return "filled"; // feature: a shift toggle, to empty the node?
      },
      randomise() {
        return Math.random() > 0.5 ? "filled" : "empty";
      },
      empty() {
        return "empty";
      },
    },
  });
};

// ⤵︎ Machine for Console Text

let count = 0;
let duration = 3000;
const prompts = [
  `Initializing grid with ${manifest.NUMBER_NODES} nodes of ${manifest.NUMBER_PARAMS} parameters.`,
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
export const HostState: Writable<any> = writable();
export const ErrorStore: Writable<any> = writable();

// create a state machine for each node that will be used to
// track whether the node is holding stored preset values

export const UI_StateArray: Writable<any[]> = writable(
  new Array(manifest.NUMBER_NODES).fill(null).map(createNodeStateFSM)
);

export const UI_State: Writable<any> = writable({
  update: () => {
    // check if UI_StateArray has changed
    // if so, update the UI_State store
    const uiStateArray = get(UI_StateArray);
    const uiState = uiStateArray.map((fsm: any) => fsm.state);
    UI_State.set(uiState);
  },
});

export const CurrentPickedID: Writable<number> = writable(0);

//---- other stuff -------------------

export const PixelDensity: Writable<number> = writable(2);

//---- audio parameters -------------------
export const Parameters: Writable<Parameter[]> = writable(manifest.parameters);
export const DisplayNames: Writable<string[]> = writable(
  manifest.parameters.map((p: Parameter) => p.name)
);
export const ParamIds: Writable<string[]> = writable(
  manifest.parameters.map((p: Parameter) => p.paramId)
);

// ---- native interops -------------------

export const NativeMessage: Writable<NativeMessages> = writable({
  requestParamValueUpdate: function (paramId: string, value: number) {
    // trigger FSM transition

    if (
      typeof globalThis.__postNativeMessage__ === "function" &&
      get(UpdateStateFSM) !== "updatingUI"
    ) {
      UpdateStateFSM.updateFrom("ui");
      globalThis.__postNativeMessage__("setParameterValue", {
        paramId,
        value,
      });
    }
  },
  // register messages from the host
  registerMessagesFromHost: function () {
    globalThis.__receiveStateChange__ = function (state: any) {
      // trigger FSM transition
      UpdateStateFSM.updateFrom("host");
      HostState.set(state);
    };
    globalThis.__receiveError__ = function (error: any) {
      // do something more useful here?
      ErrorStore.set(error);
    };
  },
  requestReady: function () {
    // send a message to the host
    if (typeof globalThis.__postNativeMessage__ === "function") {
      globalThis.__postNativeMessage__("ready", {});
    }
  },
});
