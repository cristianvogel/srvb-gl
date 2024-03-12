<script lang="ts">
  import { Canvas, watch } from "@threlte/core";
  import CssScene from "./CSS2DRenderer/CssScene.svelte";
  import Sidebar from "./controls/Sidebar.svelte";
  import InitialiseNodeStates from "./data/InitialiseNodeStates.svelte";
  import Scene from "./lib/Scene.svelte";
  import { NativeMessage } from "./stores/NativeMessage";
  import { LocksMap } from "./stores/UpdateStateFSM";
  import {
    Accumulator,
    ConsoleText,
    CurrentPickedId,
    CurrentVectorInterp,
    ShowMiniBars,
    UI_Controls,
    UI_StorageFSMs,
    UI_StoredPresets,
  } from "./stores/stores";
  import { onlyRegisteredParams } from "./utils/utils";

  import { type Vec } from "@thi.ng/vectors";
  import type { UI_ControlsMap, UI_Slider } from "../types";
  import PresetSmush from "./data/PresetSmush.svelte";
  import Logo from "./lib/Logo.svelte";
  import { Interpolation } from "./lib/interp";

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
    const sliders: Map<string, UI_Slider> = onlyRegisteredParams($UI_Controls);

    // signal when interpolation is over
    if (!interpolator?.isRunning) {
      $Accumulator = -1;
      $ConsoleText = "Ready.";
    }

    // Main interpolation routine
    if (interpolator?.isRunning) {
      $ConsoleText = $Accumulator.toFixed(0) + "%";
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
    $NativeMessage.snapshotToHost();
  }
</script>

<div id="css-renderer-target" />
<InitialiseNodeStates />
<PresetSmush bind:smush />
<Sidebar on:smush={smush} />
<Logo />

<Canvas autoRender={true} size={{ width: 575, height: 575 * 2 }}>
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
