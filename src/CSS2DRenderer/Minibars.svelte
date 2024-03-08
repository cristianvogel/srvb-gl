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

<div class="minibar">
{#if $ShowMiniBars }
    <Chart storedPreset={preset} />
{/if}
</div>

<style>
  .minibar {
    transform: scale(var(--minibar-scale, 0.85)) translate(-1rem, -3.5rem);
    position: absolute;
    pointer-events: none;
  }
</style>
