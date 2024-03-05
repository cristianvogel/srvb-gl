<script lang="ts">
  import ParameterSynchronisation from "../data/ParameterSynchronisation.svelte";
  import {
    ConsoleText,
    NativeMessage,
    UI_Controls,
    UI_StorageFSMs,
  } from "../stores/stores";
  import { Smush32 } from "@thi.ng/random";
  import type { UI_ControlsMap, UI_Slider } from "../../types";

  function updateControls(e: Event) {
    let { value, dataset } = e.target as HTMLInputElement;
    let key = dataset.key! as string;
    const sliderSettings: UI_Slider | undefined = $UI_Controls.get(key);
    if (sliderSettings) $UI_Controls.set(key, { ...sliderSettings, value: Number(value) });
    $UI_Controls = $UI_Controls;
      // todo: locks
      //    if (($LocksStore as LocksStoreEntry)[paramId] === 1) return;
      $NativeMessage.requestParamValueUpdate(
        key,
        $UI_Controls.get(key)?.value as number
      );
  }

  function randomisePresets() {
    const smush = new Smush32(0x909808303);
    const randomPreset = new Map($UI_Controls);

    $UI_StorageFSMs.forEach((fsm) => {
      fsm.storePreset(generateRandomPreset());
      fsm.randomise();
    });

    function generateRandomPreset(): UI_ControlsMap {
      randomPreset.forEach((settings, key) => {
        let rnd = smush.minmax(0, 1);
        randomPreset.set(key, {
          ...settings,
          value: rnd,
        });
      });
      return randomPreset;
    }

    $UI_StorageFSMs = $UI_StorageFSMs;
  }
</script>

<ParameterSynchronisation />

<div class="sidebar">
  <pre>{$ConsoleText}</pre>
  <button class="button" on:click={randomisePresets}>Randomise</button>
  <h3 class="heading">Controls</h3>

  {#if $UI_Controls.size}
    {#each $UI_Controls as [paramId, slider]}
      {@const { step, min, max, value } = slider}
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
