<!--  Welcome to the Mini Bar -->
<script lang='ts'>
  import type { Vec } from "@thi.ng/vectors";
  import type { UI_ControlsMap, UI_Preset } from "../../../types";
  import Bar from "./Bar.svelte";

  export let storedPreset: UI_ControlsMap;

let snapshot: UI_ControlsMap
$: snapshot  = storedPreset;
$: validPreset = storedPreset?.size > 0
$:console.log( 'stored preset? ' , snapshot )

</script>

{#if validPreset }
<div style="gap:0">
    {#each [...snapshot] as [paramId, settings]}
      <div style="height: 1.25rem">
        <p class="minibar-label">{paramId}</p>
        <svg height="16px">
          <Bar value={settings.value} />
        </svg>
      </div>
    {/each}
</div>
{/if}

<style>
  .minibar-label {
    font-size: 0.75rem;
    transform: translateY(1rem);
    margin-left: 0.125rem;
    padding: 0;
    text-align: left;
  }
</style>
