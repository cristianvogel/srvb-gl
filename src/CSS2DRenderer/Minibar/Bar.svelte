<!-- Minibar.svelte -->
<script lang='ts'>
  import { cubicIn } from "svelte/easing";
  import { tweened } from "svelte/motion";
  export let value = 0;

  let negative = value < 0;

  const readout = tweened(0,
  {duration: 150, easing: cubicIn}
  );

  readout.set( Math.abs(value));

</script>


  {#if negative}
  <g transform=" translate(0 0) scale(-1 1)">
    <rect x="-100" width={$readout * 100} height='100%' fill="darkcyan" />
  </g>
  {:else}
  <g transform="translate(100 0)">
    <rect width={$readout * 100} height='100%' fill="darkcyan" />
  </g>
  {/if}

