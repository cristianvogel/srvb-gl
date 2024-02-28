<!-- Minibar.svelte -->
<script>
  import { tweened } from "svelte/motion";
  export let value = 0;
  const readout = tweened(0);

  readout.set(value);
</script>

<rect width={$readout * 185} height='100%' fill="purple"   />
