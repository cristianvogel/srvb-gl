<script lang='ts'>
  import { HostState, UpdateStateFSM } from "../stores/stores";
  import { UI_Controls } from "../stores/stores";
  import { memoize } from "@threlte/core";
  import { equiv } from "@thi.ng/equiv" 

  const memoized = memoize( UI_Controls );

  // Reactive block for handling parameter synchronisation between UI and Host
  // This block sets up the UI to Host parameter communication that hopefully
  // won't clash with each other
  $: {
    if ( !equiv ( memoized.current, $HostState) ) {
    // go through and set all the slider controls in the UI sidebar
    if ($UI_Controls?.size && $HostState?.size) {
      if ($UpdateStateFSM !== "updatingHost") {
        // Iterate over the intersection of the keys in $HostState and $UI_Controls.
        // This way, we only perform one lookup per key.
        const commonKeys = new Set(
          [...$HostState.keys()].filter((key) => $UI_Controls.has(key))
        );
        let i = 0;
        commonKeys.forEach((key) => {
          const hostStateValue = $HostState.get(key);
          i++;
          if (hostStateValue !== undefined) {
            const sliderSettings = $UI_Controls.get(key);
            if (sliderSettings) {
              // Update only the control that corresponds to the current key
              $UI_Controls.set(key, { ...sliderSettings, value: hostStateValue});
            }
            $UI_Controls = $UI_Controls;
          }
        });
      }
    }
  }
}
</script>
