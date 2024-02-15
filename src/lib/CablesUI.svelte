<script context="module" lang="ts">
  // CABLES is a global object that doesn't exist until the patch is ready
  declare var CABLES: any;
</script>

<script lang="ts">
  // Cables initialisation and interfacing component
  import {
    CablesPatch,
    PixelDensity,
    ConsoleText,
    NativeMessage,
    CablesParams,
    manifest,
    CurrentPickedID,
    UI_StateArray,
  } from "../stores/stores";

  import { onMount } from "svelte";
  import Console from "./Console.svelte";
  import StateUpdates from "../data/StateUpdates.svelte";
  import Nodes from "../data/Nodes.svelte";
  import PatchObservers from "../data/PatchObservers.svelte";
  import { get } from "svelte/store";

  // component props
  export let patch: string;

  // local variables
  let pathPatch: string = `/${patch}/patch.js`;
  const { NUMBER_NODES, NUMBER_PARAMS } = manifest;

  // on mount, load the Cables patch into the HTML
  onMount(async () => {
    // put the device pixel density into a store if needed
    // to scale mouse movement for (non) high DPI displays (not implemented yet)
    $PixelDensity = window.devicePixelRatio || 1;
    console.log("Using PixelDensity: ", $PixelDensity);

    // embed the Cables patch into the HTML
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
  // 📌 move Cables assets folder up to /public or they don't get found
  const initializeCables = () => {
    console.log("Running Cables init...");
    CablesPatch.set(
      new CABLES.Patch({
        patch: CABLES.exportedPatch,
        prefixAssetPath: "",
        assetPath: "",
        jsPath: pathPatch,
        glCanvasId: `cables_${patch}`,
        glCanvasResizeToWindow: true,
        onError: showError,
        onPatchLoaded: () => {},
        onFinishedLoading: () => {
          patchInitialized(get(CablesPatch));
          patchFinishedLoading();
        },
        canvas: { alpha: true, premultipliedAlpha: true },
        variables: {
          // overrides initial values of vars coming from the Cables patch
          // Initialise patch_NodeStateArray
          // todo: restore a saved state? Should all empty be the default init?
          patch_NodeStateArray: new Array(NUMBER_NODES).fill(0),
          // initialise Array of arrays, 36 nodes, 4 params
          // todo: restore a saved state? Should all empty be the default init?
          patch_storedPresets: new Array(NUMBER_NODES)
            .fill(null)
            .map(() => new Array(manifest.NUMBER_PARAMS).fill(0.5)),
        },
      })
    );
  };

  // called when there is an error initializing the patch
  function showError(errId: any, errMsg: any) {
    console.error("ERROR from UI", errMsg);
  }
  // Cables patch initialized, set up interop bindings
  // prepare for connecting patch vars to Elementary native
  function patchInitialized(patch: any) {
    // get all the variables from the Cables patch
    $ConsoleText =
      "Initialised with " +
      NUMBER_NODES +
      " nodes for storing " +
      NUMBER_PARAMS +
      " parameters.";
  }
  // called when the patch is finished loading
  function patchFinishedLoading() {
    $CablesParams = $CablesPatch.getVars();
    // patch is ready, notify the host
    $NativeMessage.requestReady();
  }
</script>

<canvas id="cables_{patch}" width="800" height="474" />
{#if $CablesParams}
  <StateUpdates />
  <Nodes cablesVarKey="patch_NodeStateArray" />
  <PatchObservers />
{/if}
<div class="console">
  <Console message={$ConsoleText} />
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
