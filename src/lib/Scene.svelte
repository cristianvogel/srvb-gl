<script lang="ts">
  import { T } from "@threlte/core";
  import type { CosGradientSpec } from "@thi.ng/color/api/gradients";
  import { cosineGradient, COSINE_GRADIENTS, css } from "@thi.ng/color";
  import { Color as THREE_Color } from "THREE";
  import { useTask } from "@threlte/core";
  import {
    Instance,
    InstancedMesh,
    OrbitControls,
    interactivity,
    RoundedBoxGeometry,
    Text,
  } from "@threlte/extras";
  import { spring, tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { arrayIterator, fillRange } from "@thi.ng/arrays";
  import { createEventDispatcher } from "svelte";
  import { getNodeStateAs, UI_Styles } from "../stores/stores";

  const dispatch = createEventDispatcher();

  const aspect = useTask(() => {
    return window.innerWidth / window.innerHeight;
  });

  const gradient: CosGradientSpec = COSINE_GRADIENTS["green-blue-orange"];
  const palette = cosineGradient(28, gradient).map(css);
  let pickedColor: THREE_Color = new THREE_Color("#000");
  const colorRotate = 12;
  const elementsPerSide = 6;
  const radius = 0.3 || 0.1618;
  const layers = [1]; // layers of nodes

  const smoothy = {
    x: tweened(undefined, {
      duration: 1000,
      easing: cubicOut,
    }),
    z: tweened(undefined, {
      duration: 1000,
      easing: cubicOut,
    }),
  };
  $: smooth_X = smoothy.x;
  $: smooth_Z = smoothy.z;

  function nodeClick(o: any) {
    const nodeId: number = o.instanceId;
    dispatch("updateStates", { nodeId: nodeId });
    const stateAsColor:string = ['base', 'highlighted'].at(getNodeStateAs.number(nodeId))!;
    console.log($UI_Styles[nodeId][stateAsColor]);
    o.eventObject.color.set($UI_Styles[nodeId][stateAsColor]) ;
  }

  function nodeEnter(o: any) {
    // console.log(o.instanceId);
    smoothy.x.update((n) => o.eventObject.position.x);
    smoothy.z.update((n) => o.eventObject.position.z);
  }

  function nodeLeave(eventObject: any) {}

  interactivity();

  function assignNodeColorStates(nodeIndex: number, colorPick: string): void {
    $UI_Styles[nodeIndex].base = colorPick;
    let brighter = new THREE_Color(colorPick);
    $UI_Styles[nodeIndex].highlighted = brighter.addColors(
      new THREE_Color(colorPick),
      new THREE_Color("#f00")
    );
  }

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

<InstancedMesh position={[-1.5, -1, -1]}>
  <RoundedBoxGeometry args={[radius, radius + 0.01, radius]} />
  <T.MeshStandardMaterial color="antiqueWhite" />
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
</InstancedMesh>

<T.DirectionalLight position={[$smooth_X, 10, $smooth_Z]} />
<T.AmbientLight intensity={0.7} />
