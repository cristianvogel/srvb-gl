<script lang="ts">
  import { onMount } from "svelte";
  import {
    CablesParams,
    CablesPatch,
    HostState,
    NativeMessage,
    UpdateStateFSM,
  } from "../stores/stores";
  import { get } from "svelte/store";

  import { equiv } from "@thi.ng/equiv";

  // Reactive block for handling parameter synchronisation between UI and Host
  // Executes when the $CablesParams store is valid
  // This block sets up the UI to Host parameter communication that hopefully
  // won't clash with each other
  $: {
    if ($CablesParams) {
      const paramIDs: string[] = getParamIDsFromCablesVars();

      // go through and set all the param_ Sidebar vars in the cables patch
      if (paramIDs) {
        for (const pid of paramIDs) {
          if (!$HostState) break;
          const cablesVarName = "param_" + pid;
          const parsedHostState = JSON.parse($HostState);
          if (
            $UpdateStateFSM === "updatingUI" &&
            !equiv($CablesPatch.getVar(cablesVarName), parsedHostState[pid])
          ) {
            $CablesPatch.setVariable(cablesVarName, parsedHostState[pid]);
          }
        }
      }
    }
  }

  function getParamIDsFromCablesVars(): string[] {
    return Object.keys($CablesParams)
      .filter((k) => k.startsWith("param_"))
      .map((k) => k.replace("param_", ""));
  }

  onMount(() => {
    // add functionality to receive parameter update messages from the host
    get(NativeMessage).registerMessagesFromHost();
  });
</script>
