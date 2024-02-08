<script context="module" lang="ts">
  // CABLES is a global object that doesn't exist until the patch is ready
  declare var CABLES: any;
  declare var globalThis: any;
</script>

<script lang="ts">
  import {
    CablesPatch,
    ParamIds,
    PixelDensity,
    HostState,
    ErrorStore,
  } from "../stores/stores";
  import { onMount } from "svelte";

  export let patch: string;

  let pathPatch: string = `/${patch}/patch.js`;

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

  function registerMessagesFromHost() {
    // register messages from the host
    globalThis.__receiveStateChange__ = function (state) {
      $HostState = JSON.parse(state);
    };

    globalThis.__receiveError__ = (err) => {
      $ErrorStore = { error: err };
    };
  }

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

  let currentID = 0;

  function showError(errId: any, errMsg: any) {
    // handle critical errors here if needed
    console.error("ERROR from UI");
  }

  // Cables patch initialized, set up interop bindings
  // prepare for connecting patch vars to Elementary native

  function patchInitialized(patch: any) {
    // get  all the variables from the Cables patch
    // const cablesVariables = patch.getVars();

    // register messages from the host
    registerMessagesFromHost();

    // special cases of variables that need to be handled differently
    const paramsAverage = patch.getVar("ui_paramsAverage");
    const pickedID = patch.getVar("ui_pickedID");
    const readout = patch.getVar("ui_readout");
    const interpolatingPreset = patch.getVar("ui_interpolatingPreset");

    // inerpolatingPreset is an array of all preset parameters
    // and is interpolated on the Cables side
    // extract the preset parameters from the array
    // and send them to native plugin
    // use the average as a change trigger

    if (paramsAverage) {
      paramsAverage.on("change", function (newValue: number) {
        const values = interpolatingPreset.getValue();
        if (values && values.length >= 4) {
          const params = $ParamIds;
          for (let i = 0; i < 4; i++) {
            if (values[i] !== undefined && params[i] !== undefined) {
              requestParamValueUpdate(params[i], values[i]);
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

  function patchFinishedLoading() {}

  // Interop bindings
  function requestParamValueUpdate(paramId: string, value: number) {
    if (typeof globalThis.__postNativeMessage__ === "function") {
      globalThis.__postNativeMessage__("setParameterValue", {
        paramId,
        value,
      });
    }
  }
</script>

<canvas id="cables_{patch}" width="800" height="474" />
