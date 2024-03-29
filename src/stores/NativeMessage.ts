export declare var globalThis: any;

import {
  get,
  writable,
  type Writable
} from "svelte/store";
import type { NativeMessages } from "../../types";
import { serialisePresets } from "../utils/utils";
import { UpdateStateFSM } from "./UpdateStateFSM";

import { ConsoleText, CurrentPickedId } from "../stores/stores";
import { UI_StorageFSMs, UI_StoredPresets, HostState, ErrorStore } from "./stores";


// ---- native interops -------------------

export const NativeMessage: Writable<NativeMessages> = writable({
  //// Sending messages to the host
  // manually get the current state key of each storage slot
  // and serialise for persistentState storage in the
  // host plugin
  snapshotToHost: function () {
    let persisentState = {
      nodes: get(UI_StorageFSMs).map((fsm) => get(fsm)),
      presets: serialisePresets(get(UI_StoredPresets)),
    };
    this.setViewStateInHost(persisentState);
  },
  // store any persistent UI state in the host
  // serialisation happens here
  setViewStateInHost: function (viewState: any) {
    if (typeof globalThis.__postNativeMessage__ === "function") {
     // console.log("sending view state to host", JSON.stringify(viewState));
      globalThis.__postNativeMessage__(
        "setViewState",
        JSON.stringify(viewState)
      );
    }
  },
  // update parameter values in the host
  requestParamValueUpdate: function (paramId: string, value: number) {
    // trigger FSM transition
    if (typeof globalThis.__postNativeMessage__ === "function" &&
      get(UpdateStateFSM) !== "updatingUI") {
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

  bindHotReload: function () {
    if (process.env.NODE_ENV !== 'production') {
      import.meta.hot?.on('reload-dsp', () => {
        console.log('Sending reload dsp message');
    
        if (typeof globalThis.__postNativeMessage__ === 'function') {
          globalThis.__postNativeMessage__('reload');
        }
      });
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
        // Special case , box id , denormalisation needed as
        // the host uses a 0-1 range for the box id
        // Rewrite received HostState.box value with the
        // denormalised value.
        const deNormalised = Math.floor(get(HostState).get('box') * 63);
        get(HostState).set('box', deNormalised);
        // UPDATE the current picked id store, to reflect an automated 'box' change
        // which allows a good host, like Bitwig to modulate box picking
        // in sync with the host tempo or whatever
        if (Math.floor(get(CurrentPickedId)) !== deNormalised) { 
          CurrentPickedId.set(deNormalised);
        }
      };

      // error handling
      globalThis.__receiveError__ = function (error: any) {
        ConsoleText.set('Error: ' + error);
        // do something more useful here?
        ConsoleText.set(error);
        ErrorStore.set(error);
      };
    }
  },
});
