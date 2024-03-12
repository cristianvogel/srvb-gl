<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { cubicIn } from "svelte/easing";
  import { tweened } from "svelte/motion";

  const dispatch = createEventDispatcher();

  const slightZoom = tweened(1, {
    duration: 100,
    easing: cubicIn,
  });
</script>

<button
  class="smush-button"
  on:mouseenter={() => slightZoom.set(1.1)}
  on:mouseleave={() => slightZoom.set(1)}
  on:click={() => {
    dispatch("smush");
    slightZoom.set(0.98);
  }}
  style={`transform: scale(${$slightZoom})`}
>
  Fill Cubes With Smush
</button>

<style>
  .smush-button {
    background-color: var(--button-background-color, #142e52);
    border: none;
    color: rgb(0, 216, 254);
    padding: 12px 12px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 15px;
  }
</style>
