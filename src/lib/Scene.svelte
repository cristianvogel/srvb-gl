<script lang="ts">
  import RayCastPointer from "./RayCastPointer.svelte";

  import { T, useThrelte } from "@threlte/core";
  import type { CosGradientSpec } from "@thi.ng/color/api/gradients";
  import { cosineGradient, COSINE_GRADIENTS, css } from "@thi.ng/color";
  import { Vector3, type Vector3Tuple, Color as THREE_Color } from "three";
  import {
    Instance,
    InstancedMesh,
    OrbitControls,
    interactivity,
    RoundedBoxGeometry,
    Text,
    PortalTarget,
  } from "@threlte/extras";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { arrayIterator, fillRange } from "@thi.ng/arrays";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import {
    getNodeStateAs,
    UI_ClassFSMs,
    ShowMiniBars,
    CurrentPickedId,
    UI_Controls
  } from "../stores/stores";
  import type { Preset } from "../../types";
  import { get } from "svelte/store";

  const { size } = useThrelte();
  const dispatch = createEventDispatcher();

  $: console.log("MainView ►" + $size);

  const gradient: CosGradientSpec = COSINE_GRADIENTS["green-blue-orange"];
  const palette = cosineGradient(28, gradient).map(css);
  const colorRotate = 12;
  const elementsPerSide = 6;
  const radius = 0.3 || 0.1618;
  const layers = [1]; // layers of nodes
  const bigInstancedMeshPosition = [-1.5, -1, -1];

  function assignNodeColorStates(nodeIndex: number, colorPick: string): void {
    $UI_ClassFSMs[nodeIndex].base = colorPick;
    let brighter = new THREE_Color(colorPick);
    $UI_ClassFSMs[nodeIndex].highlighted = brighter.addColors(
      new THREE_Color(colorPick),
      new THREE_Color("#f00")
    );
  }

  function nodeClick(o: any) {

    $CurrentPickedId = o.instanceId;
    const nodeId: number = $CurrentPickedId;

    // 🚨📌 nasty bug solved here - the snapshot was being passed by reference!
    const currentSnapshot = JSON.parse(JSON.stringify($UI_Controls)); // deep copy
    
    type Snapshot = {
      preset: Preset;
    };

    const data: Snapshot = {
      preset: {
        index: nodeId,
        color: $UI_ClassFSMs[nodeId],
        name: "Node_" + nodeId,
        parameters: currentSnapshot,
      },
    };



    dispatch("newSnapshot", data);
    console.log("Node clicked: ", $UI_ClassFSMs[nodeId]);
    o.eventObject.color.set($UI_ClassFSMs[nodeId].highlighted);    

      //   const stateAsColor: (() => string ) = function() {
  //   const stateNumber = getNodeStateAs.number(nodeId) ;
  //   return ["base", "highlighted"].at(stateNumber) as string;
  // };
  //  o.eventObject.color.set($UI_Styles[nodeId][stateAsColor()]);

  }

  function nodeEnter(o: any) {
    $CurrentPickedId = o.instanceId;
  }

  function nodePointer(o: any) {
    $ShowMiniBars = true;
    $CurrentPickedId = o.instanceId;
  }

  function nodeLeave(eventObject: any) {
   $ShowMiniBars = false;
  }

  interactivity();

</script>

<T.PerspectiveCamera
  makeDefault
  args={[50, 1, 0.1, 100]}
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
          scale={4 / 6}
          text={`${nodeIndex}`}
          characters="0123456789.►𝌺-ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz"
          position={[pos.x - 0.06, pos.y + 0.1, pos.z + 0.175]}
          color={palette[colorPick - 2]}
        />
        <Instance
          on:create={(e) =>
            assignNodeColorStates(nodeIndex, palette[colorPick])}
          on:click={(e) => {
            e.stopPropagation();
            nodeClick(e);
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
