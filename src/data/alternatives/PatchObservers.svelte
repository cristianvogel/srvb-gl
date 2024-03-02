<script lang="ts">
  import { onMount } from "svelte";

  // Reactive handling for Cables observerable var updates

  import {
    CablesPatch,
    ParamIds,
    NativeMessage,
    CurrentPickedID,
    manifest,
    UI_StateArrayFSMs,
    UI_ParsedStates,
    CablesParams,
    UpdateStateFSM,
    LocksStore,
    type LocksStoreEntry,
    ConsoleText,
  } from "../stores/stores";
  import type { NodeState } from "../../types";
  import Console from "../lib/Console.svelte";

  type CablesPatch = typeof $CablesPatch.Patch;
  const { NUMBER_PARAMS } = manifest;

  onMount(() => {
    setupUIParamCallbacks($CablesPatch);
    setupCablesPatchObservers($CablesPatch);
    setupCablesCallbacks($CablesPatch);
  });

  function setupCablesPatchObservers(patch: CablesPatch) {
    console.log("setup Cables Patch Observers...you should only see this once");

    // these are non- directly used in the Host, so they need speical treatment
    const pickedID = patch.getVar("param_pickedID");
    const paramsAverage = patch.getVar("ui_paramsAverage");

    // pickedID is the index of the raycast intersect body
    // there are 36 nodes in the current patch.
    // when it changes, it updates the $CurrentPickedID store
    // and triggers a view state update
    if (pickedID) {
      pickedID.on("change", function (id: number) {
        $CurrentPickedID = id;
        $NativeMessage.setViewState($UI_ParsedStates.parsed());
      });
    }

    // inerpolatingPreset is an array of all preset parameters
    // and is interpolated on the Cables side.
    // Extract the preset parameters from the array
    // and send them to native plugin
    // Reacting to an array sum as change trigger  ( what if average is 0 🤔 )
    if (paramsAverage) {
      paramsAverage.on("change", function () {
        const interpolatingPreset = patch.getVar("ui_interpolatingPreset");
        if (!interpolatingPreset) return;
        const values = interpolatingPreset.getValue();
        if (values && values.length >= NUMBER_PARAMS) {
          const params = $ParamIds;

          // Create an array of [paramId, value] pairs
          const pairs = params.map((param, i) => [param, values[i]]);

          // Filter out 'pickedID', sort the pairs, and map to get only the values
          const sortedValues = pairs
            .sort(([paramIdA], [paramIdB]) => paramIdA.localeCompare(paramIdB))
            .map(([paramId, value]) => value);

          // Update the parameters in the host with the sorted values
          for (let i = 0; i < NUMBER_PARAMS; i++) {
            if (sortedValues[i] !== undefined && params[i] !== undefined) {
              $NativeMessage.requestParamValueUpdate(
                params[i],
                sortedValues[i]
              );
            }
          }
        }
      });
    }
  }

  /*
   * Callback functions that exist in Cables GL patch
   */

  function setupCablesCallbacks(patch: CablesPatch) {
    // implement node click interaction sent by Cables.op.callback
    patch.config.interactionFromUI = function (params: string[]) {
      console.log("Sent from UI" + params);
      $UI_StateArrayFSMs[$CurrentPickedID].toggle();
      $UI_StateArrayFSMs = [...$UI_StateArrayFSMs]; // reactive assignment
    };

    // implement randomise all nodes sent by Cables.op.callback
    patch.config.randomiseAllNodes = function (params: string[]) {
      $UI_StateArrayFSMs.forEach((node: NodeState) => node.randomise());
      $UI_StateArrayFSMs = [...$UI_StateArrayFSMs]; // reactive assignment
    };
  }

  function handleShiftClick(event: MouseEvent) {
    if (event.shiftKey) {

      $UI_StateArrayFSMs[$CurrentPickedID].empty();
      $UI_StateArrayFSMs = [...$UI_StateArrayFSMs]; // reactive assignment
    }
  }
  /*
   * setup  all the listners on the param_ set of variables from the Cables patch
   */
  function setupUIParamCallbacks(patch: any) {
    const cablesParamVars = getCablesParamOnly();

    // assign an on.("change") callback to each variable in cablesParamVars
    // only update the host if the incoming change originates from
    // the UI and not from the host, avoiding feedback
    cablesParamVars.forEach((cablesVar: string) => {
      patch.getVar(cablesVar).on("change", function (newValue: number) {
        // remove the "param_" prefix from the param name
        // to satisfy the paramId type reflected in the host
        const paramId = cablesVar.replace("param_", "");
        if (paramId === "pickedID") return; // need to think about whether pickedId will be used in host
        //console.log("updating param", paramId, newValue);
        //console.log("LocksStore", $LocksStore);
        if (($LocksStore as LocksStoreEntry)[paramId] === 1) return;

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
