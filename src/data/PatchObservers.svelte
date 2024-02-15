<script lang="ts">
  // Reactive handling for Cables observerable var updates

  import {
    CablesPatch,
    ParamIds,
    NativeMessage,
    CurrentPickedID,
    manifest,
    UI_StateArray,
  } from "../stores/stores";

  const { NUMBER_PARAMS } = manifest;
  $: {
    if ($CablesPatch) {
      setupCablesPatchObservers($CablesPatch);
      setupCablesCallbacks($CablesPatch);
    }
  }

  function setupCablesPatchObservers(patch: any) {
    const paramsAverage = patch.getVar("ui_paramsAverage");
    const interpolatingPreset = patch.getVar("ui_interpolatingPreset");
    const pickedID = patch.getVar("param_pickedID");

    // inerpolatingPreset is an array of all preset parameters
    // and is interpolated on the Cables side.
    // Extract the preset parameters from the array
    // and send them to native plugin
    // Use the average as a change trigger  ( what if average is 0 🤔 )
    if (paramsAverage) {
      paramsAverage.on("change", function () {
        const values = interpolatingPreset.getValue();
        if (values && values.length >= NUMBER_PARAMS) {
          const params = $ParamIds;
          for (let i = 0; i < NUMBER_PARAMS; i++) {
            if (values[i] !== undefined && params[i] !== undefined) {
              $NativeMessage.requestParamValueUpdate(params[i], values[i]);
            }
          }
        }
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

  function setupCablesCallbacks(patch: any) {
    // implement node click interaction sent by Cables.op.callback
    patch.config.interactionFromUI = function (params: string[]) {
      $UI_StateArray[$CurrentPickedID].toggle();
      $UI_StateArray = $UI_StateArray; // reactive assignment
    };

    // implement randomise all nodes sent by Cables.op.callback
    patch.config.randomiseAllNodes = function () {
      $UI_StateArray.forEach((node) => node.randomise());
      $UI_StateArray = $UI_StateArray; // reactive assignment
    };
  }
</script>
