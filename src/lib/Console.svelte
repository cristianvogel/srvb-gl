<script lang="ts">
  // a Console for debugging or displaying other messages
  export let message: string;
</script>

<div class="console">
  {message}
</div>

<style>
  .console {
    position: absolute;
    font-size: small;
    margin-left: 2rem;
    top: 90vh;
    left: 0;
    width: 100vw;
    height: 24px;
    background-color: transparent;
    color: #aaa;
    overflow: hidden;
  }
</style>
