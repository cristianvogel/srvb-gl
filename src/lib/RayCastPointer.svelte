<script lang="ts">
  import { T } from "@threlte/core";
  import {
    interactivity,
    Portal,
  } from "@threlte/extras";
  import { RayCastPointerPosition } from "../stores/stores";

  const onPointerMove = (e:any) => {
    $RayCastPointerPosition = e.point.toArray()
  };

  interactivity();
</script>

 <!-- raycast invisible plane for grabbing pointer position -->
  <!-- position / scale so that it covers the viewport or the area you want to track, ideally you want to make this a child of your camera -->
  <Portal id="nodes">
    <T.Mesh
      on:pointermove={onPointerMove}
      visible={false}
      position={ [1.25,0.99,1.25]}
      scale={[4.5, 2,1]} 
    >
      <T.BoxGeometry args= {[1, 0.1, 4]} />
    </T.Mesh>
  </Portal>

