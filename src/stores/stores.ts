declare var globalThis: any;

import { get, writable, type Writable } from "svelte/store";

import { createNodeStateFSM, UpdateStateFSM } from "./fsm";
import type {
  Parameter,
  LocalManifest,
  NativeMessages,
  NodeState,
} from "../../types";

//---- Cables  -------------------
export const CablesPatch: Writable<any> = writable(null);
export const CablesParams: Writable<any> = writable(null);
// ---- Parameters  -------------------
// not sure how to import this dynamically at build time
// and its really only referenced here just be
// sure to make it reflect public/manifest.json if that
// gets updated

export const manifest: LocalManifest = {
  ui_numberOfNodes: 36,
  window: {
    width: 800,
    height: 444,
  },
  parameters: [
    { paramId: "size", name: "Size", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "decay", name: "Decay", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "mod", name: "Mod", min: 0.0, max: 1.0, defaultValue: 0.5 },
    { paramId: "mix", name: "Mix", min: 0.0, max: 1.0, defaultValue: 0.5 },
    {
      paramId: "circleID",
      name: "Circle ID",
      min: 0,
      max: 1,
      defaultValue: 0.5,
    },
    {
      paramId: "nodeValue",
      name: "Node Value",
      min: 0.0,
      max: 1.0,
      defaultValue: 0.5,
    },
  ],
};

// ---- state synchronisation -------------------
export const HostState: Writable<any> = writable();
export const PreviousHostState: Writable<any> = writable(); // todo: check if this is actually being used
export const ErrorStore: Writable<any> = writable();

// flag set inside the UpdateStateFSM state machine,
// used to prevent circular update loops between host and UI
export const SourceOfChange: Writable<"ui" | "host" | ""> = writable("");

// create a state machine for each node that will be used to
// track whether the node is holding stored preset values
export const UI_StateArray: Writable<NodeState[]> = writable(
  new Array(manifest.ui_numberOfNodes).fill(null).map(createNodeStateFSM)
);

//---- other stuff -------------------
// a console for debugging or user feedback
export const ConsoleText: Writable<string> = writable("Console:");
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
      UpdateStateFSM.update("host");
      globalThis.__postNativeMessage__("setParameterValue", {
        paramId,
        value,
      });
    }
  },
  // register messages from the host
  registerMessagesFromHost: function () {
    globalThis.__receiveStateChange__ = function (state: any) {
      PreviousHostState.set(get(HostState));
      // trigger FSM transition
      UpdateStateFSM.update("ui");
      HostState.set(state);
    };
    globalThis.__receiveError__ = function (error: any) {
      // do something more useful here
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
