<script lang="ts">
  import { CablesPatch } from "../stores/stores";
  import { onMount } from "svelte";

  export let patch: string;

  let pathPatch: string = `/${patch}/patch.js`;

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
    console.error("BLOODY ERROR from UI");
  }

  // Cables patch initialized, set up interop bindings
  // prepare for connecting patch vars to Elementary native

  function patchInitialized(patch: any) {
    console.log("patch initialized", patch);

    // get  all the variables from the Cables patch
    const cablesVariables = patch.getVars();
    console.log("cablesVariables", cablesVariables);
    // select only the variables with keys that start with the prefix "ui_"
    const uiVariables = Object.keys(cablesVariables).filter((key) =>
      key.startsWith("ui_")
    );

    // iterate over all the variables and set up generic event listeners
    // that will send the variable value to native plugin through
    // the requestParamValueUpdate function
    for (const key of uiVariables) {
      const value = cablesVariables[key];
      const paramId = key.replace("ui_", "");
      if (
        paramId !== "pickedID" &&
        paramId !== "readout" &&
        paramId !== "interpolatingPreset" &&
        paramId !== "paramsAverage"
      ) {
        value.on("change", function (newValue: number) {
          requestParamValueUpdate(paramId, newValue);
        });
      }
    }

    // special cases of variables that need to be handled differently
    const paramsAverage = patch.getVar("ui_paramsAverage");
    const pickedID = patch.getVar("pickedID");
    const readout = patch.getVar("readout");
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
          const params = ["decay", "mix", "mod", "size"];
          for (let i = 0; i < 4; i++) {
            if (values[i] !== undefined && params[i] !== undefined) {
              requestParamValueUpdate(params[i], values[i]);
            }
          }
        }
      });
    }

    // pickedID is the index of the preset that is currently being picked under the mouse
    // it needs to be divided by 2 because the preset index is 2->72
    // but actually there are only 36 presets
    if (pickedID) {
      pickedID.on("change", function (id: number) {
        // store it in a global variable
        currentID = id / 2;
        // log to the console inside the patch
        const stem = "‣ ";
        patch.setVariable("topLeftText", stem + "Node » " + currentID);
      });
    }
  }

  function patchFinishedLoading() {
    // The patch is ready now, all assets have been loaded
    // not used so far
  }

  // Interop bindings
  function requestParamValueUpdate(paramId: string, value: number) {
    let globalThis = window as any;
    if (typeof globalThis.__postNativeMessage__ === "function") {
      globalThis.__postNativeMessage__("setParameterValue", {
        paramId,
        value,
      });
    }
  }
  onMount(async () => {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/nel-vcs-24/js/patch.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("Error loading Cables Patch", error);
    }
    initializeCables();
  });
</script>

<canvas id="cables_{patch}" />
