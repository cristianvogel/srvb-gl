<!--  Welcome to the Mini Bar -->
<script>
  import Bar from "./Bar.svelte";
  export let dataForChart;

  const { parameters } = dataForChart;
  const paramKeys = Object.keys(parameters);
  const paramValues = paramKeys.map((key) => parameters[key].value);
</script>

<div style="gap:0">
    {#each paramKeys as paramKey, i}
      <div style="height: 1.25rem">
        <p class="minibar-label">{paramKey}</p>
        <svg height="16px">
          <Bar value={paramValues[i]} />
        </svg>
      </div>
    {/each}
</div>


<style>
  .minibar-label {
    font-size: 0.75rem;
    transform: translateY(1rem);
    margin-left: 0.125rem;
    padding: 0;
    text-align: left;
  }
</style>
