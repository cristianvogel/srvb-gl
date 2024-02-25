<!-- <script lang="ts">
  // import CablesUi from "./lib/CablesUI.svelte";
//  import ThreeUI from "./lib/ThreeUI-tryout.svelte";
 </script> -->

<script lang="ts">
  import { Canvas } from "@threlte/core";
  import Scene from "./lib/Scene.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
</script>

<div class="w-full">
  <Canvas autoRender={true}>
    <Scene />
  </Canvas>

  <Sidebar />
</div>
