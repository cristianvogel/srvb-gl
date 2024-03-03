<script lang="ts">

  import { HostState, UpdateStateFSM } from "../stores/stores";
  import { UI_Controls as controls } from "../stores/stores";

  // Reactive block for handling parameter synchronisation between UI and Host
  // This block sets up the UI to Host parameter communication that hopefully
  // won't clash with each other
  $: {
    // go through and set all the param_ Sidebar vars in the cables patch
    if ($controls && $HostState) {
      try {
        const parsedHostState = $HostState;

        if ($UpdateStateFSM === "updatingUI") {
          // set UI params to host state params
          // extract value from parsedHostState
          // and set it to the UI_Params

          Object.keys(parsedHostState).forEach((key) => {
            if (key in $controls) {
              //   $UI_Params[key].value = parsedHostState[key];
              $controls[key].value = parsedHostState[key];
            }
          });
        }
      } catch (e) {
        console.warn("problem updating UI params! ", e);
      }
    }
  }
</script>
