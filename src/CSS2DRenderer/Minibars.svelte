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
      transform: perspective(1000px) rotateX(20deg) rotateY(0deg) rotateZ(0deg);
      transform: scale(0.85);
      position: absolute;
      margin-left: 0.75rem;
      border-radius: 0.25rem;
      padding: 0.25rem 0.5rem;
      pointer-events: none;
    }
  </style>
  