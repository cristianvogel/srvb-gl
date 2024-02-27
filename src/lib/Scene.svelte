<script lang="ts">
  import RayCastPointer from './RayCastPointer.svelte';

  import { T } from "@threlte/core";
  import type { CosGradientSpec } from "@thi.ng/color/api/gradients";
  import { cosineGradient, COSINE_GRADIENTS, css } from "@thi.ng/color";
  import { Vector3, type Vector3Tuple, Color as THREE_Color } from "three";
  import { useTask } from "@threlte/core";
  import {
    Instance,
    InstancedMesh,
    OrbitControls,
    interactivity,
    RoundedBoxGeometry,
    Text,
    transitions,
    PortalTarget,
  } from "@threlte/extras";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { arrayIterator, fillRange } from "@thi.ng/arrays";
  import { createEventDispatcher } from "svelte";
  import { getNodeStateAs, UI_Styles, RayCastPointerPosition } from "../stores/stores";  
  
  
  const dispatch = createEventDispatcher();
  

  const aspect = useTask(() => {
    return window.innerWidth / window.innerHeight;
  });

  const gradient: CosGradientSpec = COSINE_GRADIENTS["green-blue-orange"];
  const palette = cosineGradient(28, gradient).map(css);
  const colorRotate = 12;
  const elementsPerSide = 6;
  const radius = 0.3 || 0.1618;
  const layers = [1]; // layers of nodes
  const bigInstancedMeshPosition = [-1.5, -1, -1];

  const smoothy = {
    x: tweened(undefined || 0, {
      duration: 1000,
      easing: cubicOut,
    }),
    z: tweened(undefined || 0, {
      duration: 1000,
      easing: cubicOut,
    }),
  };

  $: smooth_X = smoothy.x;
  $: smooth_Z = smoothy.z;

  function assignNodeColorStates(nodeIndex: number, colorPick: string): void {
    $UI_Styles[nodeIndex].base = colorPick;
    let brighter = new THREE_Color(colorPick);
    $UI_Styles[nodeIndex].highlighted = brighter.addColors(
      new THREE_Color(colorPick),
      new THREE_Color("#f00")
    );
  }

  function nodeClick(o: any) {
    const nodeId: number = o.instanceId;
    console.log('click', nodeId);
    dispatch("updateStates", { nodeId: nodeId });
    const stateAsColor: string = ["base", "highlighted"].at(
      getNodeStateAs.number(nodeId)
    )!;
    o.eventObject.color.set($UI_Styles[nodeId][stateAsColor]);
  }

  function alignToMesh(v: Vector3): Vector3Tuple {
    let offsetVec3 = new Vector3();
    return offsetVec3
      .addVectors(v, new Vector3().fromArray(bigInstancedMeshPosition))
      .toArray();
  }

  function nodeEnter(o: any) {
    // Need to offset event object position by the
    // position offset of the big instanced
    // mesh group, which is translated to fit
    // view.
    let nodePosition = o.eventObject.position;
    nodePosition = alignToMesh(nodePosition);
    smoothy.x.update((n) => nodePosition[0]);
    smoothy.z.update((n) => nodePosition[1]);
  }

  function nodeLeave(eventObject: any) {}
  transitions();
  interactivity();
</script>

<T.PerspectiveCamera
  makeDefault
  args={[50, aspect, 0.1, 100]}
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
          text={`𝌺 ${nodeIndex}`}
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
          color={palette[colorPick]}
          position={[pos.x, pos.y, pos.z]}
          renderOrder={x + y + z}
        />
      {/each}
    {/each}
  {/each}
  <PortalTarget id="nodes"/>
</InstancedMesh>

<RayCastPointer />

<T.DirectionalLight position={[$smooth_X, 8, $smooth_Z]} />
<T.AmbientLight intensity={0.7} />
