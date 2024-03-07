<script lang="ts">
  import ParameterSynchronisation from "../data/ParameterSynchronisation.svelte";
  import {
    ConsoleText,
    LocksMap,
    NativeMessage,
    UI_Controls,
  } from "../stores/stores";
  import { tweened } from "svelte/motion";
  import type { UI_Slider } from "../../types";

  import { createEventDispatcher, onMount } from "svelte";
  import { cubicIn } from "svelte/easing";
  const dispatch = createEventDispatcher();

  const scale = tweened(1, {
    duration: 100,
    easing: cubicIn,
  });

  function updateControls(e: Event) {
    let { value, dataset } = e.target as HTMLInputElement;
    let key = dataset.key! as string;
    const sliderSettings: UI_Slider | undefined = $UI_Controls.get(key);
    if (sliderSettings)
      $UI_Controls.set(key, { ...sliderSettings, value: Number(value) });
    $UI_Controls = $UI_Controls;
    // todo: locks
    //    if (($LocksStore as LocksStoreEntry)[paramId] === 1) return;
    $NativeMessage.requestParamValueUpdate(
      key,
      $UI_Controls.get(key)?.value as number
    );
  }
</script>

<ParameterSynchronisation />

<div class="sidebar">
  <pre>{$ConsoleText}</pre>
  <button
    class="button"
    on:mouseenter={() => scale.set(1.1)}
    on:mouseleave={() => scale.set(1)}
    on:click={() => {
      dispatch("smush");
      scale.set(0.98);
    }}
    style={`transform: scale(${$scale})`}
  >
    Smush
  </button>
  <h3 class="heading">Controls</h3>

  {#if $UI_Controls.size}
    {#each $UI_Controls as [paramId, slider]}
      {@const { step, min, max, value } = slider}
      {@const lock =
        $LocksMap.has(paramId) && typeof $LocksMap.get(paramId) === "boolean"}
      {@const disabled = lock ? Boolean($LocksMap.get(paramId)) : false}
      <label>
        {paramId}
        <input
          id={`slider_${paramId}`}
          on:input={updateControls}
          on:wheel={updateControls}
          data-key={paramId}
          {value}
          {min}
          {max}
          {step}
          {disabled}
          type="range"
        />
        <div class="readout">
          {Number(slider.value).toFixed(2)}
        </div>
        <div
          id="sidebar_range_lock"
          data-key={"lock_" + paramId}
          class="col-start-5 col-span-1 text-xs my-1 text-green-500"
        ></div>
      </label>
    {/each}
  {/if}
</div>

<style>
  pre {
    font-size: 0.75rem;
    color: chartreuse;
  }

  .sidebar button {
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

  .sidebar {
    position: absolute;
    transform: scale(var(--sidebar-scale, 0.85));
    background-color: var(--sidebar-background-color, #222);
    top: var(--sidebar-position-top, 10px);
    right: var(--sidebar-position-right);
    left: var(--sidebar-position-left, 10px);
    bottom: var(--sidebar-position-bottom);
    display: grid;
    gap: 0.75rem;
    padding: 0.5rem;
    border: 1px solid;
    border-radius: 8px;
    border-color: hsl(0 0% 0% / 20%);
    box-shadow: 1px 1px 10px hsl(0 0% 0% / 10%);
  }

  .sidebar label {
    display: grid;
    grid-template-columns: repeat(1, 1fr 2fr 1fr 1fr);
    gap: 0.25rem;
    align-items: center;
    justify-items: end;
    font-weight: 600;
  }

  .sidebar label :disabled {
    opacity: 0.5;
  }

  .sidebar input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    width: 8rem;
    grid-column-start: 2;
    grid-column-end: 4;
    height: 20px;
    cursor: pointer;
    text-align: center;
  }

  .sidebar input[type="range"]::-webkit-slider-runnable-track {
    width: 300px;
    height: 5px;
    background: #594e4e;
    border: none;
    border-radius: 3px;
  }

  .sidebar input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: none;
    height: 12px;
    width: 6px;
    background: var(--slider-thumb-color);
    margin-top: -4px;
  }

  .sidebar input[type="range"]:focus {
    outline: none;
  }

  .sidebar input[type="range"]:focus::-webkit-slider-runnable-track {
    background-color: var(--slider-thumb-color);
  }

  .sidebar .readout {
    font-size: 0.75rem;
    color: lightblue;
  }

  .sidebar .heading {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--sidebar-heading-color, #fff);
    text-align: left;
    margin-bottom: 0.1rem;
    margin-top: 0.5rem;
  }
</style>
