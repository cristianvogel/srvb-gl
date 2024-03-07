<script lang="ts">
  import { Instance } from "@threlte/extras";
  import { UI_ClassFSMs, UI_Controls } from "../stores/stores";

  export let nodeIndex: number
  export let colors: {base: string, highlighted: string}
  export let position: {x: number, y: number, z: number} 
  export let handlers: {
    nodeClick: (e: MouseEvent) => void
    nodeRightClick: (e: MouseEvent) => void
    nodeEnter: (e: MouseEvent) => void
    nodeLeave: (e: MouseEvent) => void
    nodePointer: (e: MouseEvent) => void
  }
  export let accumulator: any  // store
    

</script>

<Instance
name="cube"
on:create={(o) => {
  $UI_ClassFSMs[nodeIndex].assign(colors);
}}
on:click={(e) => {
  e.stopPropagation();
  handlers.nodeClick(e);
}}
on:contextmenu={(e) => {
  // right mouse button stores
  e.stopPropagation();
  handlers.nodeRightClick(e);
}}
on:pointerenter={handlers.nodeEnter}
on:pointerleave={handlers.nodeLeave}
on:pointermove={handlers.nodePointer}
color={colors.base}
position={ [position.x, position.y, position.z]}
rotation={ [0, 0, ( $accumulator >=0 ? $accumulator * (1.01 - ($UI_Controls.get('smooth')?.value ?? 0)) : 0)]}
/>