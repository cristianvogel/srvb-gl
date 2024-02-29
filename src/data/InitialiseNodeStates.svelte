<script lang="ts">
  import { onMount } from "svelte";
  import {
    HostState,
    createNodeStateFSM,
    manifest,
    type FSM,
    UI_StateArrayFSMs,
    UI_Styles,
    type UINodeStyle,
    NativeMessage,
    ConsoleText,
  } from "../stores/stores";
  import type { NodeLoadState } from "../../types";

  // first, ping the host,
  // then build the array of FSMs with a start state that
  // restores from viewState stored in the Host or initialises
  // to empty states.

  console.log("Registering messages from host...");
  $NativeMessage.registerMessagesFromHost();

  let viewState: string[];

  // important reactive store here, will either initialise empty state
  // or restore from host viewState
  $: viewState =
    $HostState?.viewState || new Array(manifest.NUMBER_NODES).fill(null);

  $: if ($UI_StateArrayFSMs && $HostState?.viewState) {
    $ConsoleText = "Stored state:" + JSON.stringify($HostState.viewState);
    // cablesNodeStateArray.setValue(JSON.stringify($HostState?.viewState));
  }

  console.log("Starting...");
  statesArrayStoreInit();

  function statesArrayStoreInit() {
    // we are going to make an array of Finite State Machines to
    // hold the states of each Node in the UI

    type StorageFSM = ReturnType<typeof createNodeStateFSM>;

    let arr: StorageFSM[] = new Array(manifest.NUMBER_NODES).fill(null);
    let arrStyle: UINodeStyle[] = [];

    for (let i = 0; i < manifest.NUMBER_NODES; i++) {

      // are we restoring from a host viewState?
      const startingState: NodeLoadState  = viewState ? viewState[i] as NodeLoadState : "empty";

      // create the FSMs from a starting state
      arr[i] = createNodeStateFSM(startingState, i);
      arrStyle[i] = {
        base: "#000",
        color: "#111",
      };
    }
    // make sure the FSMs are put in a Writable before accessing
    $UI_StateArrayFSMs = arr;
    $UI_Styles = arrStyle;
  }
</script>
