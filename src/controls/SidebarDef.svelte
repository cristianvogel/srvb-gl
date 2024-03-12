<script lang="ts">

/*
  This is the Sidebar component. It is the parent of the Controls component.
  The UI controls we  see in the plugin view, get defined here.
*/

  import Controls from "./Controls.svelte";
  import ParameterLock from "../lib/ParameterLock.svelte";
  import { ParamDefsHost, UI_Controls } from "../stores/stores";
  import type { UI_Slider } from "../../types";

  let slider: UI_Slider = {
    index: 0,
    min: 0,
    max: 1,
    value: 0.5,
    step: 0.0001,
    isRegistered: true,
    name: "example"
  };

  $ParamDefsHost.map(({ paramId, min, max, defaultValue, group, name }, index) => {
    slider = {
      index,
      min,
      max,
      value: defaultValue,
      step: 0.0001,
      isRegistered: true,
      group, 
      name
    };
    $UI_Controls.set(paramId, slider);
  });

  // add extra params that are ViewState related only, not for controlling audio params the host
  $UI_Controls.set("smooth", {
    index: 7,
    min: 0,
    max: 1,
    value: 0.25,
    step: 0.01,
    isRegistered: false,
    name: "Rate",
    group: "morphing"
  });

  $UI_Controls.set("box", {
    index: 8,
    min: 0,
    max: 63,
    value: 1,
    step: 1,
    // special case, it is actually registered, 
    // but setting this to false means this control 
    // won't automatically update the host
    isRegistered: false, 
    name: "Box",
    group: "morphing"
  });
</script>

<Controls on:smush />
<ParameterLock />
