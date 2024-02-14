<script context="module" lang="ts">
  // CABLES is a global object that doesn't exist until the patch is ready
  declare var CABLES: any;
</script>

<script lang="ts">
  import {
    CablesPatch,
    ParamIds,
    PixelDensity,
    ConsoleText,
    NativeMessage,
    SourceOfChange,
    CablesParams,
  } from "../stores/stores";

  import { onMount } from "svelte";
  import Console from "./Console.svelte";
  import StateUpdates from "../data/StateUpdates.svelte";
  import { StateFSM } from "../stores/fsm.js";
  // component props
  export let patch: string;

  // local variables
  let pathPatch: string = `/${patch}/patch.js`;
  let currentID = 0;

  // on mount, load the Cables patch into the HTML
  onMount(async () => {
    // put the device pixel density into a store
    // this is used to scale mouse movement for (non) high DPI displays
    $PixelDensity = window.devicePixelRatio || 1;
    console.log("Using PixelDensity: ", $PixelDensity);

    // load the Cables patch here
    // seems to work
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/nel-vcs-24/js/patch.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }).then(() => {
        initializeCables();
      });
    } catch (error) {
      console.error("Error loading Cables Patch", error);
    }
  });
  // move Cables assets folder up to /public or they don't get found
  const initializeCables = () => {
    CablesPatch.set(
      new CABLES.Patch({
        patch: CABLES.exportedPatch,
        prefixAssetPath: "",
        assetPath: "",
        jsPath: pathPatch,
        glCanvasId: `cables_${patch}`,
        glCanvasResizeToWindow: true,
        onError: showError,
        onPatchLoaded: patchInitialized,
        onFinishedLoading: patchFinishedLoading,
        canvas: { alpha: true, premultipliedAlpha: true },
      })
    );
  };

  // called when there is an error initializing the patch
  function showError(errId: any, errMsg: any) {
    // handle critical errors here if needed
    console.error("ERROR from UI");
  }
  // Cables patch initialized, set up interop bindings
  // prepare for connecting patch vars to Elementary native
  function patchInitialized(patch: any) {
    $CablesParams = patch.getVars();
    ($ConsoleText = "Patch initialized"), Object.keys($CablesParams);
    // special cases of variables that need to be handled differently
    const paramsAverage = patch.getVar("ui_paramsAverage");
    const pickedID = patch.getVar("ui_pickedID");
    const interpolatingPreset = patch.getVar("ui_interpolatingPreset");

    // inerpolatingPreset is an array of all preset parameters
    // and is interpolated on the Cables side
    // extract the preset parameters from the array
    // and send them to native plugin
    // use the average as a change trigger
    if (paramsAverage) {
      paramsAverage.on("change", function () {
        const values = interpolatingPreset.getValue();
        if (values && values.length >= 4) {
          const params = $ParamIds;
          for (let i = 0; i < 4; i++) {
            if (values[i] !== undefined && params[i] !== undefined) {
              $NativeMessage.requestParamValueUpdate(params[i], values[i]);
            }
          }
        }
      });
    }

    // pickedID is the index of the preset that is currently being picked under the mouse
    // 36 presets
    // todo: use this for something, make it a store
    if (pickedID) {
      pickedID.on("change", function (id: number) {
        // store it in a global variable
        currentID = id;
      });
    }
  }
  // called when the patch is finished loading
  function patchFinishedLoading() {
    // patch is ready, notify the host
    $NativeMessage.requestReady();
  }
</script>

<canvas id="cables_{patch}" width="800" height="474" />
<StateUpdates />
<div class="console">
  <Console message={$ConsoleText} />
</div>
<div class="console">
  <Console message={"FSM: " + $StateFSM} />
</div>

<style>
  .console {
    position: relative;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 0.5em;
    font-size: 0.8em;
    font-weight: lighter;
    opacity: 1;
  }
</style>
