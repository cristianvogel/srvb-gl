<script lang="ts">
  import { Canvas } from "@threlte/core";
  import Scene from "./lib/Scene.svelte";
  import CssScene from "./CSS2DRenderer/CssScene.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import InitialiseNodeStates from "./data/InitialiseNodeStates.svelte";
  import Container from "./lib/Container.svelte";
  import {
    HostState,
    NativeMessage,
    ShowMiniBars,
    UI_StorageFSMs,
    UI_ClassFSMs,
  } from "./stores/stores";
  import { get } from "svelte/store";
  //import ParameterChange from "./data/ParameterChange.svelte";

  function updateStateFSM(e: any) {
    const { preset } = e.detail;

    const { index, color, name, parameters } = preset;

    // had to manually get the current state key of each store
    if ($UI_StorageFSMs !== $HostState?.viewState) {
      $NativeMessage.setViewState($UI_StorageFSMs.map((fsm) => get(fsm)));
    }
    $UI_StorageFSMs[preset.index].storePreset(preset);
    $UI_ClassFSMs[preset.index].toggleStyle();
    $UI_StorageFSMs = $UI_StorageFSMs; // reactive assignment
    $UI_ClassFSMs = $UI_ClassFSMs;
    $ShowMiniBars = true;
  }
</script>

<InitialiseNodeStates />
<Container>
  <div id="css-renderer-target" />
  <div class="w-full" id="main">
    <Canvas autoRender={true}>
      <Scene on:newSnapshot={updateStateFSM} />
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
