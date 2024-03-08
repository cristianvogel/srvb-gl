<script lang="ts">
  import { Canvas, useTask, watch } from "@threlte/core";
  import Scene from "./lib/Scene.svelte";
  import CssScene from "./CSS2DRenderer/CssScene.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import InitialiseNodeStates from "./data/InitialiseNodeStates.svelte";
  import {
    CurrentPickedId,
    NativeMessage,
    ShowMiniBars,
    UI_StorageFSMs,
    UI_StoredPresets,
    UI_Controls,
    Accumulator,
    CurrentVectorInterp,
    ConsoleText,
    LocksMap,
  } from "./stores/stores";
  import { onlyRegisteredParams, serialisePresets } from "./utils/utils";
  import { get } from "svelte/store";
  import { Interpolation } from "./lib/interp";
  import { FORMATTER, type Vec } from "@thi.ng/vectors";
  import type { UI_ControlsMap, UI_Slider } from "../types";
  import PresetSmush from "./data/PresetSmush.svelte";

  let interpolator: Interpolation;
  let controlsSnapshot: UI_ControlsMap;
  let smush: any; // binding to smush function in PresetSmush.svelte

  // Threlte Watch Utilities
  // 👀
  // Watch single Accumulator used for vector interpolation
  watch(Accumulator, () => {
    interpolator?.update($Accumulator);
    CurrentVectorInterp.set(interpolator?.output() as unknown as Vec);
  });

  watch(CurrentVectorInterp, () => {
    if ($CurrentVectorInterp) $ConsoleText = FORMATTER($CurrentVectorInterp);

    const sliders: Map<string, UI_Slider> =
      onlyRegisteredParams($UI_Controls);

      if (!interpolator?.isRunning) $Accumulator = -1;

    // Main interpolation routine
    if (interpolator?.isRunning) {
      sliders.forEach((param: UI_Slider, key: string) => {
        // 🤔 not sure why this is 'backwards' key and value
        const lock = typeof $LocksMap.get(key) === "boolean";
        const disabled = lock ? Boolean($LocksMap.get(key)) : false;
        param.value = $CurrentVectorInterp[param.index];
        if (!disabled) $NativeMessage.requestParamValueUpdate(key, param.value);
      });
    }
  });

  // Call back for interpolating a preset
  // hooked on UI event
  function interpolatePreset(e: any) {
    controlsSnapshot = $UI_Controls;
    const params = onlyRegisteredParams(controlsSnapshot);
    const presetTuple = {
      a: params,
      b: $UI_StoredPresets[$CurrentPickedId],
    };
    interpolator = new Interpolation(presetTuple);
    $Accumulator = -1;
    interpolator.reset(0);
  }

  // Call back for storage updates
  // hooked on UI event
  function updateStateFSM(e: any) {
    controlsSnapshot = $UI_Controls;
    const params = onlyRegisteredParams(controlsSnapshot);
    $UI_StorageFSMs[$CurrentPickedId].storePreset(params);
    $ShowMiniBars = true;
    $UI_StorageFSMs = $UI_StorageFSMs; // reactive assignment
    // manually get the current state key of each store
    // and serialise for persistentState storage in the
    // host plugin environment
    let persisentState = {
      nodes: $UI_StorageFSMs.map((fsm) => get(fsm)),
      presets: serialisePresets($UI_StoredPresets),
    };
    $NativeMessage.setViewState(persisentState);
  }


</script>

<InitialiseNodeStates />
<PresetSmush bind:smush />
<Sidebar on:smush = {smush} />

  <div id="css-renderer-target" />
    <Canvas autoRender={true} size = { { width: 575, height: 575 * 1.618 } }>
      <Scene
        on:newSnapshot={updateStateFSM}
        on:interpolatePreset={interpolatePreset}
      />
      <CssScene />
    </Canvas>
    


<style>

  #css-renderer-target {
    left: 0;
    position: absolute;
    pointer-events: none;
    top: 0;
  }
</style>
