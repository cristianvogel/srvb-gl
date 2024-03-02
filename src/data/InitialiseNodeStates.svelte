<script lang="ts">
  import {
    HostState,
    createNodeStateFSM,
    createNodeClassFSM,
    manifest,
    UI_StorageFSMs,
    UI_ClassFSMs,
    type UINodeStyle,
    NativeMessage,
    UI_StoredPresets,
  } from "../stores/stores";
  import type { ClassFSM, NodeLoadState, StorageFSM } from "../../types";
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


  // I am being really explicit here, with the for loops, because
  // I have been having so much trouble with the stores not updating
  // from stored viewState when running in the host.

  function storageFSMsInit(startingStates?: NodeLoadState[]) {

    console.log( 'running states init')
    // we are going to make an array of Finite State Machines to
    // hold the states of each Node in the UI
      for (let i = 0; i < manifest.NUMBER_NODES; i++) {
        const s = startingStates ? startingStates[i] || "empty" : "empty";
        $UI_StorageFSMs[i] = createNodeStateFSM(s, i) 
      }
      
    // make sure the FSMs are put in a Writable before accessing
    console.log('UI_StorageFSMs', $UI_StorageFSMs)
  }


  function classFSMsInit() {

    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      $UI_ClassFSMs[i] = createNodeClassFSM( {
        base: "#000",
        highlighted: "#e00",
      }, i );
    };

    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      if (get($UI_StorageFSMs[i]) === "empty") {
        $UI_ClassFSMs[i].empty();
      } else {
        $UI_ClassFSMs[i].filled();
      }
    }

    // make sure the FSMs are put in a Writable before accessing
    console.log('UI_ClassFSMs', $UI_ClassFSMs)
  }
</script>
