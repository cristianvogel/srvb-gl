// Finite State Machine for managing the surprisingly
// difficult task of parameter synchronisation betweem
// host and UI. Uses svelte-fsm.
// Seems to need at least 1 ms of debounce for reliable
// performance

import fsm from "svelte-fsm";
import { SourceOfChange, UI_State } from "./stores";
import { get } from "svelte/store";

interface Debounced {
  debounce: (delay: number) => void;
}

export const UpdateStateFSM = fsm("ready", {
  ready: {
    update(src) {
      if (src === "ui") return "updatingUI";
      if (src === "host") return "updatingHost";
    },
  },
  updatingHost: {
    _enter() {
      SourceOfChange.set("ui");
      (this.set as unknown as Debounced).debounce(1);
    },
    set: "ready",
  },
  updatingUI: {
    _enter() {
      SourceOfChange.set("host");
      (this.set as unknown as Debounced).debounce(1);
    },
    set: "ready",
  },
});

//------------- Finite States -------------------
// Define the type for the return of node state machine
export type NodeState = ReturnType<typeof createNodeStateFSM>;

export function createNodeStateFSM() {
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
}