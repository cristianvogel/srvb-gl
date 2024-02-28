<script lang="ts">
  import { Controls, guiControls } from "../controls";
  import ParameterLock from "./ParameterLock.svelte";
  import { ParamDefsHost } from "../stores/stores";
  import type { UIParameterDefinition } from "../../types";

  let paramsForUI: { [key: string]: UIParameterDefinition } =
    $ParamDefsHost.reduce(
      (
        acc: { [key: string]: UIParameterDefinition },
        { paramId, min, max, defaultValue }
      ) => {
        acc[paramId] = { min, max, value: defaultValue, step: 0.001 };
        return acc;
      },
      {}
    );

    // add extra params that are ViewState related only, not for controlling audio params the host
    paramsForUI = {
      ...paramsForUI,
      "smooth": { min: 0, max: 1, value: 0.5, step: 0.01 },
    };

    // guiControls returns a Writable store
    // pull in $guiControls if needed, not 'controlPanel'
  const controlPanel = guiControls(paramsForUI);
</script>

<Controls controls={controlPanel} />
<ParameterLock />
