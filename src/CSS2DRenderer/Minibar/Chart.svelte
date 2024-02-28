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

<div style="gap:0">
  {#each $preset as param, i}
    <div style='height: 1.25rem'>
      <p class="minibar-label">{param.name}</p>
      <svg height="1rem">
        <Bar value={param.value} />
        </svg>
    </div>
  {/each}
</div>

<style>
  .minibar-label {
    font-size: 0.75rem;
    transform: translateY(1rem); ;
    margin-left: 0.125rem;
    padding: 0;
    text-align: left;
  }
</style>