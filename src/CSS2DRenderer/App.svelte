<script lang="ts">
  import { Canvas } from '@threlte/core'
  import CssScene from './CssScene.svelte'
</script>

<div id="css-renderer-target" />

<div id="main">
  <Canvas>
    <CssScene />
  </Canvas>
</div>

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
