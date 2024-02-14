// Finite State Machine for managing the surprisingly
// difficult task of parameter synchronisation betweem
// host and UI. Uses svelte-fsm.
// Seems to need at least 1 ms of debounce for reliable
// performance

import fsm from "svelte-fsm";
import { SourceOfChange } from "./stores";

interface SetWithDebounce {
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
      (this.set as unknown as SetWithDebounce).debounce(1);
    },
    set: "ready",
  },
  updatingUI: {
    _enter() {
      SourceOfChange.set("host");
      (this.set as unknown as SetWithDebounce).debounce(1);
    },
    set: "ready",
  },
});

export function createNodeStateFSM() {
  return fsm("empty", {
    empty: {
      toggle() {
        return "filled";
      },
    },
    filled: {
      toggle() {
        return "empty";
      },
    },
  });
}
