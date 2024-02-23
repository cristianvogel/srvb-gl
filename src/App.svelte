<!-- <script lang="ts">
  // import CablesUi from "./lib/CablesUI.svelte";
//  import ThreeUI from "./lib/ThreeUI-tryout.svelte";
 </script> -->

<script lang="ts">
  import { Canvas } from "@threlte/core";
  import Scene from "./lib/Scene.svelte";
  import OffScreenScene from "./lib/OffScreenScene.svelte";

  //const rendererParameters: THREE.WebGLRendererParameters = {};
</script>

<div>
  <Canvas autoRender={true}>
    <Scene />
  </Canvas>
</div>
<!-- <div hidden>
  <Canvas autoRender={false} size={{ width: 512, height: 512 }}>
    <OffScreenScene />
  </Canvas>
</div> -->
