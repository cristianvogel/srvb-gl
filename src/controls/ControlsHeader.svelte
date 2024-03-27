<script lang="ts">
  import { Accumulator, ConsoleText } from "../stores/stores";
  import { createEventDispatcher } from "svelte";
  import type { Writable } from "svelte/store";
  
  export let foldFocus: Writable<number>;
  export let rotate: Writable<number>;

  let showControls: boolean = true;
  const dispatch = createEventDispatcher();

  function updateShowControls() {
    showControls = !showControls;
    rotate.set(showControls ? 0 : 90);
    dispatch("showControls", showControls);
  }
</script>

<div class="grid grid-cols-6 grid-rows-1 row-start-1">
  <!-- console readout-->
  <pre class="col-span-5">{$ConsoleText} </pre>

  {#if $Accumulator.isRunning()}
    <div class="col-span-5">
      <progress
        class=" absolute w-[95%] h-1 m-auto"
        value={$Accumulator.current ?? 0}
        max="1"
      ></progress>
    </div>
  {/if}

  <div class="col-start-6 col-span-1 row-start-1 justify-self-end">
    <button
      class="m-0 p-0 text-2xl opacity-60"
      style={`color: slategrey; transform: scale(${$foldFocus}) rotate(${$rotate}deg)`}
      on:click={() => updateShowControls()}
      on:mouseleave={() => foldFocus.set(1)}>▼</button
    >
  </div>
</div>

<style>
  pre {
    font-size: 0.75rem;
    color: chartreuse;
  }

  progress {
    /* Remove default appearance */
    -webkit-appearance: none;
    appearance: none;
  }

  /* Change the color */
  progress::-webkit-progress-bar {
    background-color: transparent;
  }

  progress::-webkit-progress-value {
    background-color: var(--progress-bar-color);
  }

  progress::-moz-progress-bar {
    background-color: var(--progress-bar-color);
  }
</style>
