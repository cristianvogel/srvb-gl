<script lang="ts">
  import { Instance } from "@threlte/extras";
  import { UI_ClassFSMs, UI_Controls } from "../stores/stores";
  import type { Writable } from "svelte/store";
  import { easeInOut3 } from "@thi.ng/math";
  import { degToRad } from "three/src/math/MathUtils.js";

  export let nodeIndex: number;
  export let colors: { base: string; highlighted: string };
  export let position: { x: number; y: number; z: number };
  export let userEvents: {
    nodeClick: (e: MouseEvent) => void;
    nodeRightClick: (e: MouseEvent) => void;
    nodeEnter: (e: MouseEvent) => void;
    nodeLeave: (e: MouseEvent) => void;
  };
  export let accumulator: Writable<number> | null; // store

  $: normAcc = $accumulator != -1 ? ($accumulator ?? 0) / 100 : 0;
  $: spin = degToRad(360 * easeInOut3(normAcc));

</script>

<Instance
  name="cube"
  on:create={(o) => {
    $UI_ClassFSMs[nodeIndex].assign(colors);
  }}
  on:click={(e) => {
    e.stopPropagation();
    userEvents.nodeClick(e);
  }}
  on:contextmenu={(e) => {
    // right mouse button stores
    e.stopPropagation();
    userEvents.nodeRightClick(e);
  }}
  on:pointerenter={userEvents.nodeEnter}
  on:pointerleave={userEvents.nodeLeave}
  on:pointermove={userEvents.nodeEnter}
  color={colors.base}
  position={[position.x, position.y, position.z]}
  rotation={[
    [0, 0, spin],
    [spin, 0, 0],
    [0, spin, 0],
  ][nodeIndex % 3]}
/>
