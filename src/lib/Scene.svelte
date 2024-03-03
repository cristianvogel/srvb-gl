<script lang="ts">
  import RayCastPointer from "./RayCastPointer.svelte";

  import { T, createRawEventDispatcher, useTask, useThrelte, watch } from "@threlte/core";
  import type { CosGradientSpec } from "@thi.ng/color/api/gradients";
  import { cosineGradient, COSINE_GRADIENTS, css } from "@thi.ng/color";
  import { Color as THREE_Color } from "three";
  import {
    Instance,
    InstancedMesh,
    OrbitControls,
    interactivity,
    RoundedBoxGeometry,
    Text,
    PortalTarget,
  } from "@threlte/extras";
  import { arrayIterator, fillRange } from "@thi.ng/arrays";
  import { createEventDispatcher } from "svelte";
  import {
    UI_ClassFSMs,
    ShowMiniBars,
    CurrentPickedId,
    UI_Controls,
    UI_StorageFSMs,
    CurrentFocusId,
    FrameCount,
  } from "../stores/stores";
  import type { HostParameterMap, Preset } from "../../types";
  import { get } from "svelte/store";

  const dispatch = createRawEventDispatcher();

  const { scene } = useThrelte();

  useTask( 'frameCOUNT',  (delta) => { $FrameCount++%10000 } )


  watch(UI_StorageFSMs, (storage) => {
    let gridComponents = scene.children.filter(
      (component) => component.name === "grid"
    );
    gridComponents.forEach((gridComponent) => {
      let cubes = gridComponent.children.filter((cube) => cube.name === "cube");
      cubes.forEach((cube, i) => {
        if (get(storage[i]) === "filled") {
          $UI_ClassFSMs[i].fill(cube);
        } 
      });
    });
  });

  const gradient: CosGradientSpec = COSINE_GRADIENTS["green-blue-orange"];
  const palette = cosineGradient(28, gradient).map(css);
  const colorRotate = 12;
  const elementsPerSide = 6;
  const radius = 0.3 || 0.1618;
  const layers = [1]; // layers of nodes
  const bigInstancedMeshPosition = [-1.5, -1, -1];

  function assignNodeColorStates(
    nodeIndex: number,
    colorPick: string
  ): void {
    // console.log("REF?", o.ref, nodeIndex);
    const base = new THREE_Color(colorPick);
    const highlighted = new THREE_Color("red");
    $UI_ClassFSMs[nodeIndex].assign({ base, highlighted });
  }


/* Interactivity
//////////////// 
*/
// store a preset
  function nodeRightClick(o: any) {
    $CurrentPickedId = o.instanceId;
    const nodeId: number = $CurrentPickedId;
    // 🚨📌 nasty bug solved here - the snapshot was being passed by reference!
    const controlsSnapshot:HostParameterMap = JSON.parse(JSON.stringify($UI_Controls)); // deep copy
    console.log( 'snapshot->', controlsSnapshot)
    const preset: Preset = {
        eventObject: o.eventObject,
        index: nodeId,
        name: "Node_" + nodeId,
        parameters: controlsSnapshot,
        getParameterValues: () => {
          return Object.keys(controlsSnapshot).map((p) => controlsSnapshot[p].value);
        },
    };
    dispatch("newSnapshot", preset);
  }


  // interpolate preset
  function nodeClick(o: any) {
    $CurrentPickedId = o.instanceId;
    dispatch("interpolatePreset", true);
  }

  function nodeEnter(o: any) {
    $CurrentFocusId = o.instanceId
  }

  function nodePointer(o: any) {
    $ShowMiniBars = true;
    $CurrentFocusId = o.instanceId
  }

  function nodeLeave(eventObject: any) {
    $ShowMiniBars = false;
  }

  interactivity();

</script>

<div id="updater" />
<T.PerspectiveCamera
  makeDefault
  args={[40, 1, 0.1, 100]}
  position={[elementsPerSide, elementsPerSide, elementsPerSide]}
>
  <OrbitControls
    enableDamping
    enableZoom
    maxDistance="5"
    minDistance="4"
    minAzimuthAngle="-1"
    maxAzimuthAngle="1"
    enablePan="false"
    zoomSpeed="0.1"
    panSpeed="0.05"
  />
</T.PerspectiveCamera>

<InstancedMesh position={bigInstancedMeshPosition} name="grid">
  <RoundedBoxGeometry args={[radius, radius + 0.01, radius]} />
  <T.MeshStandardMaterial />
  {#each Array.from({ length: elementsPerSide }, (_, i) => i) as x}
    {@const offsetter = arrayIterator(fillRange([], 0, -1, 1, 1 / 6))};
    {#each layers as y}
      {#each Array.from({ length: elementsPerSide }, (_, i) => i) as z}
        {@const nodeIndex = y * z + x * elementsPerSide}
        {@const colorPick = (x + y + z + colorRotate) % palette.length}
        {@const pos = {
          x: (x + Math.sin(Number(offsetter.next().value))) / 2,
          y: y,
          z: (z - 1) / 2,
        }}

        <Text
          name="label"
          scale={4 / 6}
          text={`${nodeIndex}`}
          characters="0123456789.►-ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz"
          position={[pos.x - 0.06, pos.y + 0.1, pos.z + 0.175]}
          color={palette[colorPick - 2]}
        />
        <Instance
          name="cube"
          on:create={(o) =>
            assignNodeColorStates(nodeIndex, palette[colorPick])}
          on:click={(e) => {
            // left mouse button sends
            e.stopPropagation();
            nodeClick(e);
          }}
          on:contextmenu={(e) => {
            // right mouse button stores
            e.stopPropagation();
            nodeRightClick(e);
          }}
          on:pointerenter={nodeEnter}
          on:pointerleave={nodeLeave}
          on:pointermove={nodePointer}
          color={palette[colorPick]}
          position={[pos.x, pos.y, pos.z]}
          renderOrder={x + y + z}
        />
      {/each}
    {/each}
  {/each}
  <PortalTarget id="nodes" />
</InstancedMesh>

<RayCastPointer />

<T.DirectionalLight position={[0, 8, 0]} />
<T.AmbientLight intensity={0.7} />
