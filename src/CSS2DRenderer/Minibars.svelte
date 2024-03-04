<script lang="ts">
  import { get } from "svelte/store";
  import type { UI_ControlsMap, UI_Preset } from "../../types";
  import {
    CurrentFocusId,
    ShowMiniBars,
    UI_StoredPresets,
  } from "../stores/stores";
  import Chart from "./Minibar/Chart.svelte";

  let preset: UI_ControlsMap ;

  $: preset= $UI_StoredPresets[$CurrentFocusId];
 

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
