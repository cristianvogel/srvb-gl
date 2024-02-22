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
          //  console.log("param -> " + pid);
          const parsedHostState = $HostState;
          if ($UpdateStateFSM === "updatingUI") {
            $CablesPatch.setVariable(cablesVarName, parsedHostState[pid]);
          }
        } catch (e) {}
      }
    }
  }

  function getParamIDsFromCablesVars(): string[] {
    return Object.keys($CablesParams)
      .filter((k) => k.startsWith("param_") && k !== "param_pickedID")
      .map((k) => k.replace("param_", ""));
  }

  let viewState: number[];
  $: viewState = $HostState.viewState || new Array(36).fill(0);

  function statesArrayStoreInit() {
    let arr: FSM[] = new Array(manifest.NUMBER_NODES).fill(null);
    // HostState.viewState is never ready here
    for (let i = 0; i < manifest.NUMBER_NODES; i++) {
      const startingState: number = viewState ? viewState[i] : 0;
      arr[i] = createNodeStateFSM(
        ["empty", "filled"].at(startingState) as "empty" | "filled" | undefined
      );
    }

    $UI_StateArrayFSMs = arr;

    $UI_ParsedStates.parsed = () => {
      return $UI_StateArrayFSMs.map((state: any) => {
        return get(state) === "empty" ? 0 : 1;
      });
    };
  }

  onMount(() => {
    statesArrayStoreInit();
  });
</script>
