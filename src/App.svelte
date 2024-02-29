<script lang="ts">
  import { Canvas } from "@threlte/core";
  import Scene from "./lib/Scene.svelte";
  import CssScene from './CSS2DRenderer/CssScene.svelte'
  import Sidebar from "./lib/Sidebar.svelte";
  import InitialiseNodeStates from "./data/InitialiseNodeStates.svelte";
  import Container from "./lib/Container.svelte";
  import { ShowMiniBars, UI_StateArrayFSMs, UI_Styles } from "./stores/stores";
  //import ParameterChange from "./data/ParameterChange.svelte";

  function updateStateFSM(e: any) {
    const { preset } = e.detail;
    $UI_StateArrayFSMs[preset.index].storePreset( preset );
    $UI_StateArrayFSMs = $UI_StateArrayFSMs; // reactive assignment
    $UI_Styles = $UI_Styles;
    $ShowMiniBars = true;
  }
</script>

<InitialiseNodeStates />
<Container>
  <div id="css-renderer-target" />
  <div class="w-full" id="main">
    <Canvas autoRender={true} >
      <Scene on:newSnapshot={updateStateFSM}/>
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
