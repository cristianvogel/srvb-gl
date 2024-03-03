<script lang="ts">
  import {
    HostState,
    createNodeStateFSM,
    createNodeClassFSM,
    manifest,
    UI_StorageFSMs,
    UI_ClassFSMs,
    NativeMessage,
    UI_StoredPresets,
  } from "../stores/stores";
  import type {  NodeLoadState  } from "../../types";
  import { get } from "svelte/store";


  // first, ping the host,
  // then build the array of FSMs with a start state that
  // restores from viewState stored in the Host or initialises
  // to empty states.

  console.log("Registering messages from host...");
  $NativeMessage.requestReady();
  $NativeMessage.registerMessagesFromHost();

  let restoredState = false;


  storageFSMsInit();
  classFSMsInit();

  $: {
    if ($HostState?.viewState && !restoredState) {
      const parsedViewState = JSON.parse($HostState.viewState); // needs to be parsed again here
      console.log("Got stored state parsed to ", parsedViewState);
      storageFSMsInit(parsedViewState.nodes);
      $UI_StoredPresets = parsedViewState.presets;
      restoredState = true;
    }
  }

  // we are going to make an array of Finite State Machines to
  // hold the storage of each Node in the UI

  function storageFSMsInit(startingStates?: NodeLoadState[]) {
    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      const s = startingStates ? startingStates[i] || "empty" : "empty";
      $UI_StorageFSMs[i] = createNodeStateFSM(s, i);
    }
  }

  // and another array of FSMs to handle the graphical representation of a node
  // based on its storage state.
  function classFSMsInit() {
    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      $UI_ClassFSMs[i] = createNodeClassFSM(
        { // these should get replaced with actual colours when the scene loads
          base: "#000", 
          highlighted: "#e00",
        },
        i
      );
    }

    // EXPLICITLY set the UI_ClassFSMs to the correct state
    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      if (get($UI_StorageFSMs[i]) === "empty") {
        $UI_ClassFSMs[i].empty();
      } else {
        $UI_ClassFSMs[i].filled();
      }
    }
  }
</script>
