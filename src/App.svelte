<script lang="ts">
  import { Canvas } from "@threlte/core";
  import Scene from "./lib/Scene.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import InitialiseNodeStates from "./data/InitialiseNodeStates.svelte";
  import { UI_StateArrayFSMs, UI_Styles, getNodeStateAs } from "./stores/stores";
 

  //$: if($UI_StateArrayFSMs) { console.log( JSON.stringify( $UI_StateArrayFSMs)) }

  function updateStateFSM(e: any) {
    const { nodeId } = e.detail;
    //@prettier-ignore
    ($UI_StateArrayFSMs)[nodeId].toggle();
    $UI_StateArrayFSMs = $UI_StateArrayFSMs; // reactive assignment
    $UI_Styles = $UI_Styles;
    
    
  }
</script>

<div class="w-full">
  <InitialiseNodeStates />
  <Canvas autoRender={true}>
    <Scene on:updateStates={updateStateFSM} />
  </Canvas>

  <Sidebar />
</div>
