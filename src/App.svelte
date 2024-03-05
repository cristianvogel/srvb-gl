<script lang="ts">
  import { Canvas, useTask, watch } from "@threlte/core";
  import Scene from "./lib/Scene.svelte";
  import CssScene from "./CSS2DRenderer/CssScene.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import InitialiseNodeStates from "./data/InitialiseNodeStates.svelte";
  import Container from "./lib/Container.svelte";
  import {
    CurrentPickedId,
    NativeMessage,
    ShowMiniBars,
    UI_StorageFSMs,
    UI_StoredPresets,
    UI_Controls,
    FrameCount,
    CurrentVectorInterp,
    ConsoleText
  } from "./stores/stores";
  import { onlyRegisteredParams } from "./utils/utils";
  import { get } from "svelte/store";
  import { Interpolation } from "./lib/interp";
  import { FORMATTER, type Vec } from "@thi.ng/vectors";
  import type { UI_ControlsMap, UI_Slider } from "../types";

  let interpolator: Interpolation;
  let controlsSnapshot: UI_ControlsMap;

  watch(FrameCount, () => {
    interpolator?.update($FrameCount);
    CurrentVectorInterp.set(interpolator?.output() as unknown as Vec);
  });


  watch(CurrentVectorInterp, ()=> {
    if ($CurrentVectorInterp) $ConsoleText = FORMATTER($CurrentVectorInterp)
    controlsSnapshot = $UI_Controls;
    const params: Map<string, UI_Slider> = onlyRegisteredParams(controlsSnapshot)

    if (interpolator?.isRunning) {
    params.forEach((param, key) => {
      param.value = $CurrentVectorInterp[param.index]
      $NativeMessage.requestParamValueUpdate( key, param.value)
    })
  }
  })
  
  function interpolatePreset(e: any) {
    controlsSnapshot = $UI_Controls;
    const params = onlyRegisteredParams(controlsSnapshot)
    const presetTuple = {
      a: params,
      b: $UI_StoredPresets[$CurrentPickedId],
    };
    interpolator = new Interpolation(presetTuple, true);
    $FrameCount = 0
    interpolator.reset(0)
  }

  function updateStateFSM(e:any) {
    controlsSnapshot = $UI_Controls
    const params = onlyRegisteredParams(controlsSnapshot)
    $UI_StorageFSMs[$CurrentPickedId].storePreset(params); 
    $UI_StorageFSMs = $UI_StorageFSMs; // reactive assignment
    $ShowMiniBars = true;
    // had to manually get the current state key of each store
    let persisentState = {
      nodes: $UI_StorageFSMs.map((fsm) => get(fsm)),
      presets: $UI_StoredPresets,
    };
    $NativeMessage.setViewState(persisentState);
  }


  
</script>

<InitialiseNodeStates />
<Container>
  <div id="css-renderer-target" />
  <div class="w-full" id="main">
    <Canvas autoRender={true}>
      <Scene
        on:newSnapshot={updateStateFSM}
        on:interpolatePreset={interpolatePreset}
      />
      <CssScene />
    </Canvas>
    <Sidebar />
  </div>
</Container>

<style>
  div#main {
    height: 100%;
  }
  #css-renderer-target {
    left: 0;
    position: absolute;
    pointer-events: none;
    top: 0;
  }
</style>
