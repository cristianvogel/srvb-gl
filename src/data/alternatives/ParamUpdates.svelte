<script lang="ts">
  import { onMount } from "svelte";
  import {
    CablesParams,
    CablesPatch,
    HostState,
    UpdateStateFSM,
    createNodeStateFSM,
    manifest,
    type FSM,
    UI_ParsedStates,
    UI_StateArrayFSMs,
  } from "../stores/stores";
  import { get } from "svelte/store";

  // Reactive block for handling parameter synchronisation between UI and Host
  // This block sets up the UI to Host parameter communication that hopefully
  // won't clash with each other
  $: {
    const paramIDs: string[] = getParamIDsFromCablesVars();
    // go through and set all the param_ Sidebar vars in the cables patch
    if (paramIDs) {
      for (const pid of paramIDs) {
        if (!$HostState) break;
        const cablesVarName = "param_" + pid;
        try {
          const parsedHostState = $HostState;
          if ($UpdateStateFSM === "updatingUI") {
            $CablesPatch.setVariable(cablesVarName, parsedHostState[pid]);
          }
        } catch (e) {}
      }
    }
  }

  onMount(() => {
    // first, construct the array of FSMs and put them in a Writable
    statesArrayStoreInit();
  });

  let viewState: number[];

  // important reactive store here, will either initialise empty state
  // or restore from host viewState
  $: viewState = $HostState.viewState || new Array(36).fill(0);

  function statesArrayStoreInit() {
    // we are going to make an array of Finite State Machines to
    // hold the states of each Node in the UI
    let arr: FSM[] = new Array(manifest.NUMBER_NODES).fill(null);
    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      const startingState: number = viewState ? viewState[i] : 0;
      arr[i] = createNodeStateFSM(
        ["empty", "filled"].at(startingState) as "empty" | "filled" | undefined
      );
    }
    // make sure the FSMs are put in a Writable before accessing
    $UI_StateArrayFSMs = arr;

    // derive a 'parsed' version of the FSMs result ( "empty" | "filled" ) as a numerical array
    $UI_ParsedStates.parsed = () => {
      return $UI_StateArrayFSMs.map((state: any) => {
        return get(state) === "empty" ? 0 : 1;
      });
    };
  }

  // utility for renaming params from Cables
  function getParamIDsFromCablesVars(): string[] {
    return Object.keys($CablesParams)
      .filter((k) => k.startsWith("param_") && k !== "param_pickedID")
      .map((k) => k.replace("param_", ""));
  }
</script>
