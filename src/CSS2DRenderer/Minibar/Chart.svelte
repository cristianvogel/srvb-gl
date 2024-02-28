<!-- Mockup mini bar -->
<script>
  import Bar from "./Bar.svelte";
  import { writable } from "svelte/store";

  const preset = writable([
    {
      param: 1,
      name: "Decay",
      value: 0.9,
    },
    {
      param: 2,
      name: "Mix",
      value: 0.2,
    },
    {
      param: 3,
      name: "Mod",
      value: 0.5,
    },

    {
      param: 4,
      name: "Size",
      value: 0.95,
    },
  ]);
</script>

<div class="sidebar" style="gap:0">
  {#each $preset as param, i}
    <div>
      <h5 class="sidebar-label">{param.name}</h5>
      <svg height="16px">
        <Bar value={param.value} />
        <svg> </svg></svg
      >
    </div>
  {/each}
</div>
