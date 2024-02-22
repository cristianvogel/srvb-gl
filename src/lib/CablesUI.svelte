<script context="module" lang="ts">
  // CABLES is a global object that doesn't exist until the patch is ready
  declare var CABLES: any;
</script>

<script lang="ts">
  // Cables initialisation and interfacing component
  import {
    CablesPatch,
    PixelDensity,
    NativeMessage,
    CablesParams,
    manifest,
    HostState,
    UI_StateArrayFSMs,
  } from "../stores/stores";

  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import ParamUpdates from "../data/ParamUpdates.svelte";
  import Console from "../lib/Console.svelte";
  import Nodes from "../data/Nodes.svelte";
  import PatchObservers from "../data/PatchObservers.svelte";
  import { get } from "svelte/store";
  import { ConsoleText, ConsoleFSM } from "../stores/stores";
  import ParameterLock from "./ParameterLock.svelte";

  // component props
  export let patch: string;

  let showConsole: boolean;
  $: showConsole = true;

  // reactive
  $: {
    if ($ConsoleText !== "") {
      showConsole = true;
      setTimeout(() => {
        $ConsoleText = "";
        showConsole = false;
      }, 5000); // Clear the console after 5000 milliseconds (5 seconds)
    }
  }
  // local variables
  let pathPatch: string = `/${patch}/patch.js`;
  const { NUMBER_NODES, NUMBER_PARAMS } = manifest;

  // on mount, load the Cables patch into the HTML
  onMount(async () => {
    // patch is loading, notify the host
    $NativeMessage.requestReady();
    $NativeMessage.registerMessagesFromHost();

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
          // overrides for initial values of vars coming from the Cables patch
          ui_parameterLocks: new Array(NUMBER_PARAMS).fill(0),
          // Initialise patch_NodeStateArray
          // todo: restore a saved state? Should all empty be the default init?
          // patch_NodeStateArray: new Array(NUMBER_NODES).fill(0),
          // initialise Array of arrays, 36 nodes, 4 params
          // todo: restore a saved state? Should all empty be the default init?
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
  function patchInitialized(patch: any) {}
  // called when the patch is finished loading
  function patchFinishedLoading() {
    $CablesParams = $CablesPatch.getVars();
  }
</script>

<canvas id="cables_{patch}" width="800" height="474" />
{#if $CablesParams && $CablesPatch}
  <ParamUpdates />
  <Nodes cablesNodeStateArray="patch_NodeStateArray" />
  <PatchObservers />
  <ParameterLock />
{/if}
{#if showConsole && $ConsoleFSM}
  <div class="console" transition:fade>
    <Console message={$ConsoleText} />
  </div>
{/if}

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
