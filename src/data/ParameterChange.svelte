<script lang="ts">

    import { HostState, ParamIds, UI_Params, UpdateStateFSM } from "../stores/stores";
  

    // receive the UI controls from the Sidebar
    export let controls: any;
    
    // $: console.log( 'UI Params - ',$UI_Params, ' & ' , $controls);
    // $: console.log( 'Registered ParamIds' , $ParamIds )

    let viewState: number[];
    // important reactive store here, will either initialise empty state
  // or restore from host viewState
  $: viewState = $HostState?.viewState || new Array(36).fill(0);


    // Reactive block for handling parameter synchronisation between UI and Host
  // This block sets up the UI to Host parameter communication that hopefully
  // won't clash with each other
    $: {
       
        // go through and set all the param_ Sidebar vars in the cables patch
        if ($UI_Params) {
    
            try {
            const parsedHostState = $HostState;
            if ($UpdateStateFSM === "updatingUI") {
                // set UI params to host state params
                $controls = parsedHostState;
            }
            } catch (e) {
                console.warn('problem updating UI params! ', e);
            }
        }
    }
    
</script>