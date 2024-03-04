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

  import { get } from "svelte/store";
  import { Interpolation } from "./lib/interp";
  import { FORMATTER, type Vec } from "@thi.ng/vectors";
  import type { UI_ControlsMap } from "../types";

  let interpolator: Interpolation;

  watch(FrameCount, () => {
    interpolator?.update($FrameCount);
    CurrentVectorInterp.set(interpolator?.output() as unknown as Vec);
  });

  watch(CurrentVectorInterp, ()=> {
    if ($CurrentVectorInterp) $ConsoleText = FORMATTER($CurrentVectorInterp)
  
  //  $NativeMessage.requestParamValueUpdate()
  }
  )

  function interpolatePreset(e: any) {
    const controlsSnapshot = $UI_Controls;
    const presetTuple = {
      a: controlsSnapshot,
      b: $UI_StoredPresets[$CurrentPickedId],
    };
    interpolator = new Interpolation(presetTuple, true);
    $FrameCount = 0
    interpolator.reset(0)
  }

  function updateStateFSM(e:any) {
    const snapshot: UI_ControlsMap = $UI_Controls
    let onlyRegisteredParams = new Map([...snapshot].filter(([key, value]) => value.isRegistered));
    $UI_StorageFSMs[$CurrentPickedId].storePreset(onlyRegisteredParams); // deep copy
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
