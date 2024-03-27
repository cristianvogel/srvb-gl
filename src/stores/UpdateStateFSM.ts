

import {
  get,
  readable,
  writable,
  type Readable,
  type Writable
} from "svelte/store";
import fsm from "svelte-fsm";
import type { NodeLoadState } from "../../types";
import { UI_StorageFSMs, UI_StoredPresets, manifest, ConsoleText } from "./stores";

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

// toggles to lock a parameter in the UI
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

export const LocksMap: Writable<Map<Element | string, FSM | boolean>> = writable(new Map());

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
      empty(eventObject?) {
        if (eventObject) eventObject.color.set(colors.base);
        return "empty";
      },
      base() {
        return colors.base;
      },
    },
  });
}
// ⤵︎ Factory function for making Machines that manage state of presets in the GUI

export function createNodeStateFSM(initial: NodeLoadState, index: number) {
  return fsm(initial, {
    empty: {
      randomise() {
        return Math.random() > 0.1 ? "filled" : "empty";
      },
      storePreset(p) {
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
        return Math.random() < 0.9 ? "filled" : "empty";
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
      },
    },
  });
}
// ⤵︎ Machine for Console Text
let count = 0;
let duration = 3000;
const prompts = [
  `Grid with ${manifest.NUMBER_NODES} cubes for storing ${manifest.NUMBER_PARAMS} parameters.`,
  "Right click cube to store preset.",
  "Left click to morph cube to cube.",
  "Use smoothing to control morph rate.",
  "Smush the grid to randomise.",
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
    next: "prompt_4",
  },
  prompt_4: {
    _enter: enterPrompt,
    next: "prompt_5",
  },
  prompt_5: {
    _enter: enterPrompt,
    next: "prompt_6",
  },
  prompt_6: {
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
