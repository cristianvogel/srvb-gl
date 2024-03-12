<script lang="ts">
  import { slide } from "svelte/transition";
  import type { UI_Slider } from "../../types";
  import { NativeMessage } from "../stores/NativeMessage";
  import { LocksMap } from "../stores/UpdateStateFSM";
  import { UI_Controls } from "../stores/stores";
  import ParameterSynchronisation from "../data/ParameterSynchronisation.svelte";
  import ControlsHeader from "./ControlsHeader.svelte";
  import SmushButton from "./SmushButton.svelte";
  import { cubicIn } from "svelte/easing";
  import { tweened } from "svelte/motion";

  let showControls: boolean = true;

  const rotate = tweened(0, {
    duration: 250,
    easing: cubicIn,
  });

  const foldFocus = tweened(1, {
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
    $NativeMessage.requestParamValueUpdate(
      key,
      $UI_Controls.get(key)?.value as number
    );
  }
</script>

<ParameterSynchronisation />

{#if !showControls}
  <div class="sidebar-folded">
    <ControlsHeader
      {rotate}
      {foldFocus}
      on:showControls={(e) => (showControls = e.detail)}
    />
    <!-- <SmushButton on:smush /> -->
  </div>
{/if}

{#if showControls}
  <div
    class="sidebar"
    transition:slide={{
      delay: 0,
      duration: 300,
      axis: "y",
    }}
  >
    <ControlsHeader
      {rotate}
      {foldFocus}
      on:showControls={(e) => (showControls = e.detail)}
    />
    <SmushButton on:smush />

    {#if $UI_Controls.size}
      {#each $UI_Controls as [paramId, slider], i}
        {@const { step, min, max, value, group, name } = slider}
        {@const newGroupDiff =
          i < 1
            ? true
            : group !==
              Array.from($UI_Controls.values())[Math.max(0, i - 1)].group}
        {@const lock =
          $LocksMap.has(paramId) && typeof $LocksMap.get(paramId) === "boolean"}
        {@const disabled = lock ? Boolean($LocksMap.get(paramId)) : false}
        {#if newGroupDiff}
          <div class="flex">
            <pre class="text-xs text-[slategrey]">{group}</pre>
            <svg class=" absolute p-4">
              <line x1="0" y1="0" x2="100%" y2="0" stroke="darkslategrey" />
            </svg>
          </div>
        {/if}
        <label>
          {name}
          <input
            style="z-index: 100"
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
{/if}

<style>
  .sidebar {
    position: absolute;
    transform: scale(var(--sidebar-scale, 0.85));
    background-color: var(--sidebar-background-color, #222);
    opacity: 0.9;
    top: var(--sidebar-position-top, 10px);
    width: var(--sidebar-width, 21rem);
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

  .sidebar-folded {
    position: absolute;
    transform: scale(var(--sidebar-scale, 0.85));
    background-color: var(--sidebar-background-color, #222);
    opacity: 0.9;
    top: calc(var(--sidebar-position-top, 10px) + 2rem);
    width: var(--sidebar-width, 21rem);
    left: var(--sidebar-position-left, 10px);
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
    grid-template-columns: 1fr 2fr 1fr 1fr;
    gap: 0.25rem;
    align-items: center;
    justify-items: left;
    font-weight: 600;
    color: var(--sidebar-label-color, antiquewhite);
    font-size: 0.85rem;
  }

  .sidebar label :disabled {
    opacity: 0.5;
  }

  .sidebar input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
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
    padding-left: 1rem;
  }
</style>
