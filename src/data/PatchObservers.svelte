<script lang="ts">
  import { onMount } from "svelte";

  // Reactive handling for Cables observerable var updates

  import {
    CablesPatch,
    ParamIds,
    NativeMessage,
    CurrentPickedID,
    manifest,
    UI_StateArray,
    CablesParams,
  } from "../stores/stores";
  import { UpdateStateFSM } from "../stores/fsm";

  type CablesPatch = typeof $CablesPatch.Patch;
  const { NUMBER_PARAMS } = manifest;

  $: {
    if ($CablesPatch) {
      setupUIParamCallbacks($CablesPatch);
      setupCablesPatchObservers($CablesPatch);
      setupCablesCallbacks($CablesPatch);
    }
  }

  function setupCablesPatchObservers(patch: CablesPatch) {
    const paramsAverage = patch.getVar("ui_paramsAverage");
    const interpolatingPreset = patch.getVar("ui_interpolatingPresetObject");
    const pickedID = patch.getVar("param_pickedID");
    console.log(
      "interpolatingPreset = ",
      JSON.stringify(interpolatingPreset.value)
    );
    if (interpolatingPreset) {
      interpolatingPreset.on("change", function (newValue: any) {
        const changingValues = newValue;
        if (
          changingValues &&
          Object.keys(changingValues).length >= NUMBER_PARAMS
        ) {
          const params = $ParamIds;
          Object.keys(changingValues).forEach((key) => {
            const paramId = params[parseInt(key)];
            if (paramId !== undefined) {
              $NativeMessage.requestParamValueUpdate(
                paramId,
                changingValues[key]
              );
            }
          });
        }
      });
    }

    // inerpolatingPreset is an array of all preset parameters
    // and is interpolated on the Cables side.
    // Extract the preset parameters from the array
    // and send them to native plugin
    // Use the average as a change trigger  ( what if average is 0 🤔 )
    if (paramsAverage) {
      paramsAverage.on("change", function (value: number) {
        console.log("paramsAverage now = ", value);
      });
    }

    // pickedID is the index of the raycast intersect body
    // there are 36 nodes in the current patch.
    // when it changes, it updates the $CurrentPickedID store
    if (pickedID) {
      pickedID.on("change", function (id: number) {
        $CurrentPickedID = id;
      });
    }
  }

  function setupCablesCallbacks(patch: CablesPatch) {
    // implement node click interaction sent by Cables.op.callback
    patch.config.interactionFromUI = function (params: string[]) {
      $UI_StateArray[$CurrentPickedID].toggle();
      $UI_StateArray = $UI_StateArray; // reactive assignment
    };

    // implement randomise all nodes sent by Cables.op.callback
    patch.config.randomiseAllNodes = function (params: string[]) {
      $UI_StateArray.forEach((node) => node.randomise());
      $UI_StateArray = $UI_StateArray; // reactive assignment
    };
  }

  function handleShiftClick(event: MouseEvent) {
    if (event.shiftKey) {
      $UI_StateArray[$CurrentPickedID].empty();
      $UI_StateArray = $UI_StateArray; // reactive assignment
    }
  }

  function setupUIParamCallbacks(patch: any) {
    // get  all the param_ set of variables from the Cables patch
    const cablesParamVars = getCablesParamOnly();

    // assign an on.("change") callback to each variable in cablesParamVars
    // only update the host if the incoming change originates from
    // the UI and not from the host, avoiding feedback
    cablesParamVars.forEach((cablesVar: string) => {
      patch.getVar(cablesVar).on("change", function (newValue: number) {
        // remove the "param_" prefix from the param name
        // to satisfy the paramId type reflected in the host
        const paramId = cablesVar.replace("param_", "");
        if ($UpdateStateFSM !== "updatingUI")
          $NativeMessage.requestParamValueUpdate(paramId, newValue);
      });
    });
  }

  function getCablesParamOnly(): string[] {
    return Object.keys($CablesParams).filter((k: string) =>
      k.startsWith("param_")
    );
  }
</script>

<!-- unfortunately not working inside plugin -->
<svelte:window on:click|preventDefault={handleShiftClick} />
