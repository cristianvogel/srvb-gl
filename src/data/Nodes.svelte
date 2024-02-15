<script lang="ts">
  // Update the Cables patch with the current state of the UI
  // reflected in the UI_StateArray store
  import {
    UI_StateArray,
    CablesPatch,
    CurrentPickedID,
  } from "../stores/stores";
  import { get } from "svelte/store";
  type CablesVar = ReturnType<typeof $CablesPatch.getVar>;

  export let cablesVarKey: string | CablesVar = "patch_NodeStateArray";
  let parsedArray = [];

  $: {
    if ($UI_StateArray && $CablesPatch && $CurrentPickedID) {
      const cablesVarObject = $CablesPatch.getVar(cablesVarKey);
      parsedArray = $UI_StateArray.map((state) => {
        return get(state) === "empty" ? 0 : 1;
      });
      cablesVarObject.setValue(parsedArray);
    }
  }
</script>
