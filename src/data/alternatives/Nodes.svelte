<script lang="ts">
  // Update the Cables patch with the current state of the UI
  // reflected in the UI_StateArray store
  import {
    UI_StateArrayFSMs,
    CablesPatch,
    NativeMessage,
    HostState,
    ConsoleText,
    UI_ParsedStates,
  } from "../stores/stores";

  import { onMount } from "svelte";
  type CablesVar = ReturnType<typeof $CablesPatch.getVar>;

  let parsed: number[];
  export let cablesNodeStateArray: string | CablesVar = "patch_NodeStateArray";

  cablesNodeStateArray = $CablesPatch.getVar(cablesNodeStateArray);

  onMount(() => {
    cablesNodeStateArray.setValue($UI_ParsedStates.parsed());
  });

  $: {
    if ($HostState.viewState !== undefined) {
      if (JSON.parse($HostState.viewState) !== $UI_ParsedStates.parsed()) {
        $NativeMessage.setViewState($UI_ParsedStates.parsed());
      }
      cablesNodeStateArray.setValue($HostState?.viewState);
    }
  }

  $: if ($UI_StateArrayFSMs) {
    $ConsoleText =
      "UI_ParsedStates.parsed() -> " +
      $UI_ParsedStates.parsed() +
      "Stored state:" +
      JSON.stringify($HostState?.viewState);
    cablesNodeStateArray.setValue(JSON.stringify($HostState?.viewState));
  }
</script>
