declare var globalThis: any;

import { get, writable, type Writable } from "svelte/store";
import type { Parameter } from "../../types";
import { StateFSM } from "./fsm";

//---- Cables  -------------------
export const CablesPatch: Writable<any> = writable();
export const CablesParams: Writable<any> = writable();
// ---- Parameters  -------------------
// not sure how to import this dynamically at build time
// and its really only referenced here just be
// sure to make it reflect public/manifest.json if that
// gets updated

export const manifest = {
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
export const PreviousHostState: Writable<any> = writable();
export const ErrorStore: Writable<any> = writable();
export const SourceOfChange: Writable<string> = writable("");

//---- other stuff -------------------
export const ConsoleText: Writable<string> = writable("Console:");
export const PixelDensity: Writable<number> = writable(2);

// ---- parameters -------------------
export const Parameters: Writable<Parameter[]> = writable(manifest.parameters);
export const DisplayNames: Writable<string[]> = writable(
  manifest.parameters.map((p: Parameter) => p.name)
);
export const ParamIds: Writable<string[]> = writable(
  manifest.parameters.map((p: Parameter) => p.paramId)
);

export type NativeMessages = {
  requestParamValueUpdate(paramId: string, value: number): void;
  registerMessagesFromHost(): void;
  requestReady(): void;
};
// ---- native interops -------------------
export const NativeMessage: Writable<NativeMessages> = writable({
  requestParamValueUpdate: function (paramId: string, value: number) {
    // trigger FSM transition

    ConsoleText.set(" sending from UI ");
    if (
      typeof globalThis.__postNativeMessage__ === "function" &&
      get(StateFSM) !== "updatingUI"
    ) {
      StateFSM.update("host");
      globalThis.__postNativeMessage__("setParameterValue", {
        paramId,
        value,
      });
    }
  },
  // register messages from the host
  registerMessagesFromHost: function () {
    globalThis.__receiveStateChange__ = function (state: any) {
      ConsoleText.set(" receiving from host ");
      PreviousHostState.set(get(HostState));
      // trigger FSM transition
      StateFSM.update("ui");
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
