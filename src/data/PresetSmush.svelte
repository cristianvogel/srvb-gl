<script lang="ts">
  import { UI_Controls, UI_StorageFSMs, UI_ClassFSMs } from "../stores/stores";
  import { Smush32 } from "@thi.ng/random";
  import type { StorageFSM, UI_ControlsMap, UI_Slider } from "../../types";
  import { get } from "svelte/store";

  export const smush = () => {
    console.log("Smushing presets..");
    const smush = new Smush32(0x909808303);
    const randomPreset = new Map($UI_Controls);

    function generateRandomPreset(): UI_ControlsMap {
      randomPreset.forEach((settings, key) => {
        let rnd = smush.minmax(0, 1);
        randomPreset.set(key, {
          ...settings,
          value: rnd,
        });
      });
      return randomPreset;
    }

    $UI_StorageFSMs.forEach((fsm: StorageFSM) => {
      fsm.randomise();
      if (get(fsm) === "filled") {
        fsm.storePreset(generateRandomPreset());
      } else {
        fsm.clearPreset();
      }
    });

    $UI_StorageFSMs = $UI_StorageFSMs;
    $UI_ClassFSMs = $UI_ClassFSMs;
  };
</script>
