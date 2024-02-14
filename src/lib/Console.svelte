<script lang="ts">
  export let message: string;
</script>

<div class="console">
  {message}
</div>

<style>
  .console {
    position: absolute;
    font-size: x-small;
    margin-left: 2rem;
    top: 90vh;
    left: 0;
    width: 100vw;
    height: 16px;
    background-color: transparent;
    color: #aaa;
    overflow: hidden;
  }
</style>
