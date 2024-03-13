<script lang="ts">
  import { get } from "svelte/store";
  import type { UI_ControlsMap } from "../../types";
  import {
    CurrentFocusId,
    ShowMiniBars,
    UI_StoredPresets,
    UI_ClassFSMs,

    UI_Controls

  } from "../stores/stores";
  import Chart from "./Minibar/Chart.svelte";

  let preset: UI_ControlsMap ;
  $: { 
    if ($UI_StoredPresets.length > 0 && $CurrentFocusId in $UI_StoredPresets) {
      preset = $UI_StoredPresets[$CurrentFocusId];
    } else {
      preset = $UI_Controls;
      console.log('no preset found');
    }
  }

</script>


{#if $ShowMiniBars }
    <Chart storedPreset={preset} />
{/if}


