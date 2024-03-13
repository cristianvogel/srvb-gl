<script>
  import { T } from '@threlte/core'
  import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

  export let pointerEvents = false

  let element
</script>

<div class='css2d-object'
  bind:this={element}
  style:pointer-events={pointerEvents ? 'auto' : 'none !important'}

>
  <slot />
</div>

{#if element}
  <T
    {...$$restProps}
    is={CSS2DObject}
    args={[element]}
    let:ref
  >
    <slot
      name="three"
      {ref}
    />
  </T>
{/if}

<style>
  .css2d-object {
    position: absolute;
    will-change: transform;
  }
  </style>