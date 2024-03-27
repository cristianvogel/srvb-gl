<script lang="ts">
  import { Canvas, watch } from "@threlte/core";
  import CssScene from "./CSS2DRenderer/CssScene.svelte";
  import Sliders from "./controls/Sliders.svelte";
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
  import type { UI_ControlsMap, UI_Slider } from "../types";
  import type { Vec } from "@thi.ng/vectors";
  import PresetSmush from "./data/PresetSmush.svelte";
  import Logo from "./lib/Logo.svelte";
  import { VectorInterpolator } from "./lib/interp";
  import { get } from "svelte/store";

  let vectorInterpolator: VectorInterpolator;
  let controlsSnapshot: UI_ControlsMap;
  let smush: any; // binding to smush function in PresetSmush.svelte

  // Threlte Watch Utilities
  // 👀
  // Watch single Accumulator used for vector interpolation
  watch(Accumulator, (acc) => {
    vectorInterpolator?.update(acc.current * 100);
    CurrentVectorInterp?.set(vectorInterpolator?.current as Vec);
  });

  watch(CurrentPickedId, (id) => {
    if (!vectorInterpolator) return;
    if (vectorInterpolator?.isRunning() && validTarget(id)) {
      console.log("changing course");
      vectorInterpolator?.changeCourseTowards(
        validTarget(id) as UI_ControlsMap
      );
    }
  });

  watch(CurrentVectorInterp, () => {
    // Main interpolation run routine
    if (vectorInterpolator?.isRunning()) {
      const sliders: Map<string, UI_Slider> = onlyRegisteredParams($UI_Controls);

      // user feedback progress bar
      $ConsoleText = $Accumulator.isRunning()
        ? ($Accumulator.current * 100).toFixed(0) + "%"
        : "Ready.";

      sliders.forEach((param: UI_Slider, key: string) => {
        // 🤔 not sure why this is 'backwards' key and value
        const lock = typeof $LocksMap.get(key) === "boolean";
        const disabled = lock ? Boolean($LocksMap.get(key)) : false;
        param.value = $CurrentVectorInterp[param.index];
        if (!disabled) $NativeMessage.requestParamValueUpdate(key, param.value);
      });
    }
  });

  function validTarget(id: number): false | UI_ControlsMap {
    return get($UI_StorageFSMs[id]) === "empty" ? false : $UI_StoredPresets[id];
  }

  // Call back for interpolating a preset
  // hooked on event that triggers
  // new interpolation procedure
  function interpolatePreset(e: any) {
    const noPreset = get($UI_StorageFSMs[$CurrentPickedId]) === "empty";
    if (noPreset) {
      console.warn("No preset to interpolate to.");
      return;
    }

    controlsSnapshot = $UI_Controls;

    if (vectorInterpolator === undefined || vectorInterpolator.isStopped()) {
      const params = onlyRegisteredParams(controlsSnapshot);
      const presetTuple = {
        a: params,
        b: $UI_StoredPresets[$CurrentPickedId],
      };
      vectorInterpolator = new VectorInterpolator(presetTuple);
      vectorInterpolator.reset(0);
      $Accumulator.start();
    } else {
      vectorInterpolator?.changeCourseTowards(
        $UI_StoredPresets[$CurrentPickedId]
      );
      $Accumulator.update();
    }
  }

  // Call back for storage updates
  // hooked on event that saves a preset
  // into a box
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
<Sliders on:smush={smush} />
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
