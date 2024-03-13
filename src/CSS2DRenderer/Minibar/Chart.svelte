<!--  Welcome to the Mini Bar -->
<script lang="ts">
  import type { UI_ControlsMap } from "../../../types";
  import Bar from "./Bar.svelte";

  export let storedPreset: UI_ControlsMap;

  let snapshot: UI_ControlsMap;
  $: snapshot = storedPreset;
  $: validPreset = storedPreset?.size > 0;
</script>

{#if validPreset}
  <div class="minibar">
    {#each [...snapshot] as [paramId, settings]}
      <div class='bar'>
        <p class="minibar-label">{paramId}</p>
        <svg height="16px">
          <Bar value={settings.value} />
        </svg>
      </div>
    {/each}
  </div>
{/if}

<style>
  .minibar {
    transform: scale(var(--minibar-scale, 0.85)) translate(-1rem, -3.5rem);
    position: absolute;
    width: 3rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-flow: row;
    gap: 0;
    pointer-events: none;
    cursor: ne-resize;
    overflow-x: visible;
  }

  .minibar-label {
    font-size: 0.75rem;
    transform: translateY(1rem) translateX(6rem);
    padding-left: 0.5rem;
    text-align: left;
  }

  .bar {
    height: 1.25rem;
    grid-column: 1;
  }
</style>
