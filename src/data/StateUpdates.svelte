<script lang="ts">
  import { onMount } from "svelte";
  import {
    CablesParams,
    CablesPatch,
    HostState,
    NativeMessage,
  } from "../stores/stores";
  import { get } from "svelte/store";
  import { UpdateStateFSM } from "../stores/fsm";
  import { equiv } from "@thi.ng/equiv";

  $: if ($CablesPatch) {
    setupUIParamCallbacksAndState($CablesPatch);
  }

  $: {
    if ($CablesParams) {
      $CablesParams = $CablesParams;

      const paramIDs: string[] = getParamIDsFromCablesVars();

      // go through and set all the param_ variables in the cables patch
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

  function setupUIParamCallbacksAndState(patch: any) {
    // get  all the param_ set of variables from the Cables patch
    const cablesParamVars = getCablesParamOnly();

    // assign an on.("change") callback to each variable in cablesParamVars
    // only update the host if the incoming change originates from
    // the UI and not from the host, avoiding feedback
    cablesParamVars.forEach((cablesVar: string) => {
      patch.getVar(cablesVar).on("change", function (newValue: number) {
        // remove the "param_" prefix from the param name
        // to satisfy a paramId type that the host can match
        const paramId = cablesVar.replace("param_", "");
        if ($UpdateStateFSM !== "updatingUI")
          $NativeMessage.requestParamValueUpdate(paramId, newValue);
      });
    });
  }
  onMount(() => {
    // add functionality to receive parameter update messages from the host
    get(NativeMessage).registerMessagesFromHost();
  });

  function getParamIDsFromCablesVars(): string[] {
    return Object.keys($CablesParams)
      .filter((k) => k.startsWith("param_"))
      .map((k) => k.replace("param_", ""));
  }

  function getCablesParamOnly(): string[] {
    return Object.keys($CablesParams).filter((k: string) =>
      k.startsWith("param_")
    );
  }
</script>
