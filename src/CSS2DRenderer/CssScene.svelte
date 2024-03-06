<script lang="ts">
  import { T, useTask, useThrelte, watch } from '@threlte/core'
  import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
  import CssObject from './CssObject.svelte'
  import { RayCastPointerPosition } from '../stores/stores';
  import Minibars from './Minibars.svelte';

  const { scene, size, autoRenderTask, camera } = useThrelte()



  // Set up the CSS2DRenderer to run in a div placed atop the <Canvas>
  const element = document.querySelector('#css-renderer-target') as HTMLElement
  const CSSRenderer = new CSS2DRenderer( { element })

  CSSRenderer.setSize($size.width, $size.height)
  // We are running two renderers, and don't want to run
  // updateMatrixWorld twice; tell the renderers that we'll handle
  // it manually.
  // https://threejs.org/docs/#api/en/core/Object3D.updateWorldMatrix
  scene.matrixWorldAutoUpdate = false

  // To update the matrices *once* per frame, we'll use a task that is added
  // right before the autoRenderTask. This way, we can be sure that the
  // matrices are updated before the renderers run.
  useTask(
    () => {
      scene.updateMatrixWorld();

    },
    { before: autoRenderTask }
  )

  // The CSS2DRenderer needs to be updated after the autoRenderTask, so we
  // add a task that runs after it.
  useTask(
    () => {
      // Update the DOM
      CSSRenderer.render(scene, camera.current)
    },
    {
      after: autoRenderTask,
      autoInvalidate: false
    }
  )
</script>



<CssObject
  position={$RayCastPointerPosition}
  pointerEvents={false}
>
  <Minibars />
  
</CssObject>


