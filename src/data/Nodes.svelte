<script lang="ts">
  // Update the Cables patch with the current state of the UI
  // reflected in the UI_StateArray store
  import { UI_StateArray, CablesPatch } from "../stores/stores";
  type CablesVar = ReturnType<typeof $CablesPatch.getVar>;

  export let cablesVarKey: string | CablesVar = "patch_NodeStateArray";

  $: {
    if ($UI_StateArray && $CablesPatch) {
      const cablesVarObject = $CablesPatch.getVar(cablesVarKey);
      const parsedArray = $UI_StateArray.map((state) =>
        state === "filled" ? 1 : 0
      );
      cablesVarObject.setValue(parsedArray);
    }
    console.log(
      "patch_NodeStateArray: ",
      $CablesPatch.getVar("patch_NodeStateArray")
    );
  }
</script>
