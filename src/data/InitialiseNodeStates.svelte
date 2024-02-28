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
  } from "../stores/stores";

  onMount(() => {
    console.log("Registering messages from host...");
    $NativeMessage.registerMessagesFromHost();
    // first, construct the array of FSMs and put them in a Writable
   console .log('Initialising Node States...');
    statesArrayStoreInit();
  });

  let viewState: number[];

  // important reactive store here, will either initialise empty state
  // or restore from host viewState
  $: viewState = $HostState?.viewState || new Array(36).fill(0);

  function statesArrayStoreInit() {
    // we are going to make an array of Finite State Machines to
    // hold the states of each Node in the UI
    let arr: FSM[] = new Array(manifest.NUMBER_NODES).fill(null);
    let arrStyle: UINodeStyle[] = [];
    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      const startingState: number = viewState ? viewState[i] : 0;
      arr[i] = createNodeStateFSM(
        ["empty", "filled"].at(startingState) as "empty" | "filled" | undefined
      );
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
