<script>
  import { ShowMiniBars } from '../stores/stores';
  import Chart from './Minibar/Chart.svelte'
</script>
  
<div class='minibar'>
  {#if $ShowMiniBars}
  <Chart />
  {/if}
  
    
</div>

  <style>
    .minibar {
      transform: scale(var(--minibar-scale, 0.85)) translate(-1rem, -3.5rem);
      position: absolute;
      pointer-events: none;
    }
  </style>
  