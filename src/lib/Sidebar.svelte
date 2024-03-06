<script lang="ts">
  import Controls from "../controls/Controls.svelte";
  import ParameterLock from "./ParameterLock.svelte";
  import { ParamDefsHost, UI_Controls } from "../stores/stores";
  import type {  UI_Slider } from "../../types";

let slider: UI_Slider = { index:0, min: 0, max: 1, value: 0.5, step: 0.0001 , isRegistered: true};

  $ParamDefsHost.map(({ paramId, min, max, defaultValue }, index) => {
    slider = { index, min, max, value: defaultValue, step: 0.0001, isRegistered: true };
  $UI_Controls.set(paramId, slider);
});

 // add extra params that are ViewState related only, not for controlling audio params the host
 $UI_Controls.set("smooth", { index: 5, min: 0, max: 1, value: 0.5, step: 0.01, isRegistered: false });
</script>

<Controls on:smush />
<ParameterLock />
