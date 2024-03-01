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
  } from "../stores/stores";
  import type { ClassFSM, NodeLoadState, StorageFSM } from "../../types";

  // first, ping the host,
  // then build the array of FSMs with a start state that
  // restores from viewState stored in the Host or initialises
  // to empty states.

  console.log("Registering messages from host...");
  $NativeMessage.requestReady();
  $NativeMessage.registerMessagesFromHost();

  let restoredState = false;

  statesArrayStoreInit();

  $: {
    if ($HostState?.viewState && !restoredState) {
      if ($UI_StorageFSMs) $UI_StorageFSMs = [];
      const parsedViewState = JSON.parse($HostState.viewState); // needs to be parsed again here
      console.log("Got stored state parsed to ", parsedViewState);
      statesArrayStoreInit(parsedViewState);
      restoredState = true;
    }
  }

  function statesArrayStoreInit(startingStates?: NodeLoadState[]) {
    // we are going to make an array of Finite State Machines to
    // hold the states of each Node in the UI

 

    let arrStorage: StorageFSM[] = new Array(manifest.NUMBER_NODES).fill(null);
    let arrClass: ClassFSM[] = new Array(manifest.NUMBER_NODES).fill(null);;

    for (let i = 0; i < manifest.NUMBER_NODES; i++) {

      const startingState: NodeLoadState = startingStates
        ? startingStates[i]
        : "empty";
        
      // create the FSMs from a starting state
      arrStorage[i] = createNodeStateFSM(startingState, i);
      arrClass[i] = createNodeClassFSM( {
        base: "#000",
        highlighted: "#111",
      }, i );
    };
    // make sure the FSMs are put in a Writable before accessing
    $UI_StorageFSMs = arrStorage;
    $UI_ClassFSMs = arrClass;
  }
</script>
