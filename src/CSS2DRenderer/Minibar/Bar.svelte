<!-- Minibar.svelte -->
<script lang='ts'>
  import { cubicIn } from "svelte/easing";
  import { tweened } from "svelte/motion";
  export let value = 0;
  const readout = tweened(0,
  {duration: 150, easing: cubicIn}
  );



  readout.set(value);
</script>

<rect width={$readout * 100} height='100%' fill="darkcyan" />


