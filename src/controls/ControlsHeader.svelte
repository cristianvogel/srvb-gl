<script lang='ts'>
  import { tweened } from "svelte/motion";
  import { ConsoleText } from "../stores/stores";
  import { cubicIn } from "svelte/easing";
  import { createEventDispatcher } from "svelte";
  import type { Writable } from "svelte/store";

    export let foldFocus: Writable<number>;
    export let rotate: Writable<number>;

  let showControls: boolean = true ;
  const dispatch = createEventDispatcher();


  function updateShowControls() {
    showControls = !showControls;
    rotate.set( showControls ? 0 : 90 );
    dispatch('showControls', showControls);
  }

</script>

<div class="grid grid-cols-6 grid-rows-1 row-start-1">
  <pre class="col-span-5">{$ConsoleText}</pre>
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
</style>
